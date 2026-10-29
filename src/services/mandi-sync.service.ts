import prisma from "../lib/prisma";
import { fetchMandiPage, GovernmentMandiRecord } from "../integrations/data-gov/data-gov.client";
import { normalizeForMatch, normalizeMandiRecord } from "../integrations/data-gov/mandi.normalizer";
import { evaluatePriceAlertsForObservation } from "./price-alert.service";

export type MandiSyncSummary = {
  fetched: number;
  pages: number;
  createdMarkets: number;
  createdPrices: number;
  updatedPrices: number;
  skippedUnmatchedCrops: string[];
  rejectedRecords: string[];
  failures: string[];
};

type MandiPageFetcher = (offset: number, limit: number) => ReturnType<typeof fetchMandiPage>;

async function resolveCrop(commodity: string) {
  const crops = await prisma.crop.findMany();
  const normalizedCommodity = normalizeForMatch(commodity);
  return crops.find((crop) => normalizeForMatch(crop.name) === normalizedCommodity);
}

async function resolveMarket(record: ReturnType<typeof normalizeMandiRecord>) {
  const markets = await prisma.market.findMany({ where: { state: record.state, district: record.district } });
  const normalizedName = normalizeForMatch(record.market);
  let existing = markets.find((market) => normalizeForMatch(market.name) === normalizedName);

  if (!existing) {
    existing = await prisma.market.findFirst({
      where: { name: record.market, location: `${record.district}, ${record.state}` },
    }) ?? undefined;
  }

  if (existing) {
    if (existing.state !== record.state || existing.district !== record.district) {
      existing = await prisma.market.update({
        where: { id: existing.id },
        data: { state: record.state, district: record.district },
      });
    }

    return { market: existing, created: false };
  }

  const market = await prisma.market.create({
    data: {
      name: record.market,
      location: `${record.district}, ${record.state}`,
      state: record.state,
      district: record.district,
    },
  });

  return { market, created: true };
}

export async function syncMandiRecords(records: GovernmentMandiRecord[]): Promise<MandiSyncSummary> {
  const summary: MandiSyncSummary = {
    fetched: records.length,
    pages: 1,
    createdMarkets: 0,
    createdPrices: 0,
    updatedPrices: 0,
    skippedUnmatchedCrops: [],
    rejectedRecords: [],
    failures: [],
  };

  for (const rawRecord of records) {
    try {
      const record = normalizeMandiRecord(rawRecord);
      const crop = await resolveCrop(record.commodity);

      if (!crop) {
        summary.skippedUnmatchedCrops.push(record.commodity);
        continue;
      }

      const { market, created } = await resolveMarket(record);
      summary.createdMarkets += created ? 1 : 0;
      const existing = await prisma.marketPrice.findUnique({ where: { observationKey: record.observationKey } });
      const data = {
        cropId: crop.id,
        marketId: market.id,
        price: record.modalPrice,
        unit: "quintal",
        minPrice: record.minPrice,
        maxPrice: record.maxPrice,
        modalPrice: record.modalPrice,
        arrivalDate: record.arrivalDate,
        variety: record.variety || null,
        grade: record.grade || null,
        sourceName: "AGMARKNET",
        sourceRecordId: null,
        observationKey: record.observationKey,
      };

      await prisma.marketPrice.upsert({
        where: { observationKey: record.observationKey },
        create: data,
        update: data,
      });

      await evaluatePriceAlertsForObservation({
        cropId: crop.id,
        marketId: market.id,
        unit: data.unit,
        price: record.modalPrice,
        observationKey: record.observationKey,
      });

      if (existing) {
        summary.updatedPrices += 1;
      } else {
        summary.createdPrices += 1;
      }
    } catch (error) {
      summary.rejectedRecords.push(error instanceof Error ? error.message : "Invalid government record");
    }
  }

  return summary;
}

export async function syncMandiBatch(offset = 0, limit = 1): Promise<MandiSyncSummary> {
  const page = await fetchMandiPage(offset, limit);
  return syncMandiRecords(page.records);
}

function mergeSummary(target: MandiSyncSummary, page: MandiSyncSummary) {
  target.fetched += page.fetched;
  target.pages += page.pages;
  target.createdMarkets += page.createdMarkets;
  target.createdPrices += page.createdPrices;
  target.updatedPrices += page.updatedPrices;
  target.skippedUnmatchedCrops.push(...page.skippedUnmatchedCrops);
  target.rejectedRecords.push(...page.rejectedRecords);
  target.failures.push(...page.failures);
}

export async function syncMandiPages(fetchPage: MandiPageFetcher, pageSize = 100): Promise<MandiSyncSummary> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new Error("Mandi sync page size must be a positive integer");
  }

  const summary: MandiSyncSummary = {
    fetched: 0,
    pages: 0,
    createdMarkets: 0,
    createdPrices: 0,
    updatedPrices: 0,
    skippedUnmatchedCrops: [],
    rejectedRecords: [],
    failures: [],
  };
  let offset = 0;

  while (true) {
    let page;

    try {
      page = await fetchPage(offset, pageSize);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mandi page request failed";
      summary.failures.push(`offset ${offset}: ${message}`);
      throw new Error(`Mandi full sync failed: ${summary.failures.join("; ")}`);
    }

    const pageSummary = await syncMandiRecords(page.records);
    mergeSummary(summary, pageSummary);
    summary.pages += 0;

    const count = page.count ?? page.records.length;

    if (count === 0 || (page.total !== undefined && offset + count >= page.total)) {
      break;
    }

    const nextOffset = offset + count;

    if (nextOffset <= offset) {
      throw new Error("Mandi full sync failed: API pagination did not advance");
    }

    offset = nextOffset;
  }

  return summary;
}

export function syncAllMandiData(pageSize = 100) {
  return syncMandiPages(fetchMandiPage, pageSize);
}
