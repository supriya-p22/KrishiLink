import prisma from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../utils/http-error";

export const saleIntentStatuses = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type SaleIntentStatus = (typeof saleIntentStatuses)[number];

export type SaleIntentListFilters = {
  status?: SaleIntentStatus;
  cropId?: string;
};

const saleIntentInclude = {
  crop: true,
  buyer: true,
  buyerDemand: true,
  farmerCrop: true,
};

const transitionMap: Record<SaleIntentStatus, readonly SaleIntentStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["COMPLETED", "CANCELLED"],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export function isSaleIntentStatus(value: string): value is SaleIntentStatus {
  return (saleIntentStatuses as readonly string[]).includes(value);
}

export async function createSaleIntent(
  farmerId: string,
  farmerCropId: string,
  buyerDemandId: string,
  quantity: number,
) {
  return prisma.$transaction(async (transaction) => {
    const farmer = await transaction.farmerProfile.findUnique({ where: { id: farmerId } });

    if (!farmer) {
      throw new NotFoundError("Farmer not found");
    }

    const [farmerCrop, buyerDemand] = await Promise.all([
      transaction.farmerCrop.findFirst({
        where: { id: farmerCropId, farmerId },
        include: { crop: true },
      }),
      transaction.buyerDemand.findUnique({
        where: { id: buyerDemandId },
        include: { buyer: true, crop: true },
      }),
    ]);

    if (!farmerCrop) {
      throw new NotFoundError("Farmer crop listing not found");
    }

    if (!buyerDemand) {
      throw new NotFoundError("Buyer demand not found");
    }

    if (buyerDemand.status !== "OPEN") {
      throw new BadRequestError("Sale intent requires an OPEN buyer demand");
    }

    if (buyerDemand.validUntil && buyerDemand.validUntil <= new Date()) {
      throw new BadRequestError("Buyer demand has expired");
    }

    if (farmerCrop.cropId !== buyerDemand.cropId) {
      throw new BadRequestError("Farmer crop and buyer demand crops must match");
    }

    if (farmerCrop.unit !== buyerDemand.unit) {
      throw new BadRequestError("Farmer crop and buyer demand units must match");
    }

    if (quantity > Number(farmerCrop.quantity)) {
      throw new BadRequestError("Sale intent quantity exceeds farmer crop quantity");
    }

    if (quantity > Number(buyerDemand.quantity)) {
      throw new BadRequestError("Sale intent quantity exceeds buyer demand quantity");
    }

    return transaction.saleIntent.create({
      data: {
        farmerCropId,
        buyerDemandId,
        buyerId: buyerDemand.buyerId,
        cropId: buyerDemand.cropId,
        quantity,
        unit: farmerCrop.unit,
        agreedPrice: buyerDemand.offeredPrice,
        status: "PENDING",
      },
      include: saleIntentInclude,
    });
  });
}

export async function listFarmerSaleIntents(
  farmerId: string,
  filters: SaleIntentListFilters,
) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId } });

  if (!farmer) {
    throw new NotFoundError("Farmer not found");
  }

  if (filters.cropId) {
    const crop = await prisma.crop.findUnique({ where: { id: filters.cropId } });

    if (!crop) {
      throw new NotFoundError("Crop not found");
    }
  }

  return prisma.saleIntent.findMany({
    where: {
      farmerCrop: { farmerId },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
    },
    include: saleIntentInclude,
    orderBy: { createdAt: "desc" },
  });
}

async function getOwnedSaleIntent(farmerId: string, id: string) {
  const saleIntent = await prisma.saleIntent.findFirst({
    where: { id, farmerCrop: { farmerId } },
    include: saleIntentInclude,
  });

  if (!saleIntent) {
    throw new NotFoundError("Sale intent not found");
  }

  return saleIntent;
}

export function getFarmerSaleIntent(farmerId: string, id: string) {
  return getOwnedSaleIntent(farmerId, id);
}

export async function updateFarmerSaleIntent(
  farmerId: string,
  id: string,
  status: SaleIntentStatus,
) {
  const saleIntent = await getOwnedSaleIntent(farmerId, id);

  if (!transitionMap[saleIntent.status as SaleIntentStatus]?.includes(status)) {
    throw new BadRequestError(`Cannot transition sale intent from ${saleIntent.status} to ${status}`);
  }

  return prisma.saleIntent.update({
    where: { id },
    data: { status },
    include: saleIntentInclude,
  });
}

export async function deleteFarmerSaleIntent(farmerId: string, id: string) {
  const saleIntent = await getOwnedSaleIntent(farmerId, id);

  if (saleIntent.status !== "PENDING" && saleIntent.status !== "CANCELLED") {
    throw new BadRequestError("Only PENDING or CANCELLED sale intents can be deleted");
  }

  await prisma.saleIntent.delete({ where: { id } });
}