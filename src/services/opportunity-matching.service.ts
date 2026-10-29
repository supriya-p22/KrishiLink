import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type OpportunityFilters = {
  cropId?: string;
  limit?: number;
};

type FarmerCropWithCrop = Awaited<ReturnType<typeof getFarmerCrops>>[number];

const farmerCropInclude = { crop: true };
const buyerDemandInclude = { buyer: true, crop: true };
const marketPriceInclude = { market: true, crop: true };

async function getFarmerCrops(farmerId: string, cropId?: string) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId } });

  if (!farmer) {
    throw new NotFoundError("Farmer not found");
  }

  if (cropId) {
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });

    if (!crop) {
      throw new NotFoundError("Crop not found");
    }
  }

  return prisma.farmerCrop.findMany({
    where: { farmerId, ...(cropId ? { cropId } : {}) },
    include: farmerCropInclude,
  });
}

function isQuantityCompatible(farmerCrop: FarmerCropWithCrop, demand: { quantity: unknown; unit: string }) {
  return farmerCrop.unit === demand.unit && Number(demand.quantity) >= Number(farmerCrop.quantity);
}

function getTime(value: Date) {
  return value.getTime();
}

export async function findFarmerOpportunities(farmerId: string, filters: OpportunityFilters) {
  const farmerCrops = await getFarmerCrops(farmerId, filters.cropId);

  if (farmerCrops.length === 0) {
    return { farmerId, opportunities: [] };
  }

  const cropIds = farmerCrops.map((farmerCrop) => farmerCrop.cropId);
  const now = new Date();
  const [buyerDemands, marketPrices] = await Promise.all([
    prisma.buyerDemand.findMany({
      where: {
        cropId: { in: cropIds },
        status: "OPEN",
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      },
      include: buyerDemandInclude,
    }),
    prisma.marketPrice.findMany({
      where: { cropId: { in: cropIds } },
      include: marketPriceInclude,
      orderBy: { recordedAt: "desc" },
    }),
  ]);

  const marketLatestByCropAndMarket = new Map<string, typeof marketPrices[number]>();

  for (const marketPrice of marketPrices) {
    const key = `${marketPrice.cropId}:${marketPrice.marketId}`;

    if (!marketLatestByCropAndMarket.has(key)) {
      marketLatestByCropAndMarket.set(key, marketPrice);
    }
  }

  const opportunities: Array<{
    type: "BUYER" | "MARKET";
    effectivePrice: number;
    timestamp: number;
    tieBreaker: string;
    data: Record<string, unknown>;
  }> = [];

  for (const farmerCrop of farmerCrops) {
    const demandsForCrop = buyerDemands.filter((demand) => demand.cropId === farmerCrop.cropId);

    for (const demand of demandsForCrop) {
      opportunities.push({
        type: "BUYER",
        effectivePrice: Number(demand.offeredPrice),
        timestamp: getTime(demand.createdAt),
        tieBreaker: demand.id,
        data: {
          type: "BUYER",
          buyer: demand.buyer,
          crop: demand.crop,
          farmerQuantity: farmerCrop.quantity,
          farmerUnit: farmerCrop.unit,
          demandQuantity: demand.quantity,
          demandUnit: demand.unit,
          offeredPrice: demand.offeredPrice,
          status: demand.status,
          validUntil: demand.validUntil,
          quantityCompatible: isQuantityCompatible(farmerCrop, demand),
        },
      });
    }

    for (const marketPrice of marketLatestByCropAndMarket.values()) {
      if (marketPrice.cropId !== farmerCrop.cropId) {
        continue;
      }

      opportunities.push({
        type: "MARKET",
        effectivePrice: Number(marketPrice.price),
        timestamp: getTime(marketPrice.recordedAt),
        tieBreaker: marketPrice.id,
        data: {
          type: "MARKET",
          market: marketPrice.market,
          crop: marketPrice.crop,
          farmerQuantity: farmerCrop.quantity,
          farmerUnit: farmerCrop.unit,
          price: marketPrice.price,
          unit: marketPrice.unit,
          recordedAt: marketPrice.recordedAt,
        },
      });
    }
  }

  opportunities.sort((left, right) => {
    if (right.effectivePrice !== left.effectivePrice) {
      return right.effectivePrice - left.effectivePrice;
    }

    if (left.type === "BUYER" && right.type === "BUYER") {
      const leftCompatible = left.data.quantityCompatible === true;
      const rightCompatible = right.data.quantityCompatible === true;

      if (leftCompatible !== rightCompatible) {
        return rightCompatible ? 1 : -1;
      }
    }

    if (right.timestamp !== left.timestamp) {
      return right.timestamp - left.timestamp;
    }

    return left.tieBreaker.localeCompare(right.tieBreaker);
  });

  const ranked = filters.limit === undefined ? opportunities : opportunities.slice(0, filters.limit);

  return {
    farmerId,
    opportunities: ranked.map((opportunity) => opportunity.data),
  };
}