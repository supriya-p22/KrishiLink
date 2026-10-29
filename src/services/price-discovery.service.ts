import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type PriceDiscoverySort = "price_asc" | "price_desc" | "latest";

export type PriceDiscoveryFilters = {
  cropId?: string;
  marketId?: string;
  limit?: number;
  sort: PriceDiscoverySort;
};

const priceDiscoveryInclude = {
  crop: true,
  market: true,
};

function formatPriceRecord(record: {
  crop: unknown;
  market: unknown;
  price: unknown;
  unit: string;
  recordedAt: Date;
}) {
  return {
    crop: record.crop,
    market: record.market,
    price: record.price,
    unit: record.unit,
    recordedAt: record.recordedAt,
  };
}

async function validateFilters(filters: PriceDiscoveryFilters) {
  if (filters.cropId) {
    const crop = await prisma.crop.findUnique({ where: { id: filters.cropId } });

    if (!crop) {
      throw new NotFoundError("Crop not found");
    }
  }

  if (filters.marketId) {
    const market = await prisma.market.findUnique({ where: { id: filters.marketId } });

    if (!market) {
      throw new NotFoundError("Market not found");
    }
  }
}

export async function comparePrices(filters: PriceDiscoveryFilters) {
  await validateFilters(filters);

  const orderBy = filters.sort === "latest"
    ? { recordedAt: "desc" as const }
    : { price: filters.sort === "price_asc" ? "asc" as const : "desc" as const };

  const records = await prisma.marketPrice.findMany({
    where: {
      cropId: filters.cropId,
      marketId: filters.marketId,
    },
    include: priceDiscoveryInclude,
    orderBy,
    ...(filters.limit === undefined ? {} : { take: filters.limit }),
  });

  return records.map(formatPriceRecord);
}

export async function findBestMarket(cropId: string) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId } });

  if (!crop) {
    throw new NotFoundError("Crop not found");
  }

  const record = await prisma.marketPrice.findFirst({
    where: { cropId },
    include: priceDiscoveryInclude,
    orderBy: [{ price: "desc" }, { recordedAt: "desc" }],
  });

  return record ? formatPriceRecord(record) : null;
}
