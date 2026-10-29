import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type BuyerInput = {
  name: string;
  type: string;
  location: string;
  contact?: string;
};

export type BuyerDemandInput = {
  cropId: string;
  quantity: number;
  unit: string;
  offeredPrice: number;
  status: string;
  validUntil: Date | null;
};

const buyerInclude = {
  buyerDemands: {
    include: { crop: true },
    orderBy: { createdAt: "desc" as const },
  },
};

const demandInclude = {
  buyer: true,
  crop: true,
};

export function listBuyers() {
  return prisma.buyer.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getBuyer(id: string) {
  const buyer = await prisma.buyer.findUnique({ where: { id }, include: buyerInclude });

  if (!buyer) {
    throw new NotFoundError("Buyer not found");
  }

  return buyer;
}

export function createBuyer(data: BuyerInput) {
  return prisma.buyer.create({ data });
}

export async function updateBuyer(id: string, data: BuyerInput) {
  await getBuyer(id);
  return prisma.buyer.update({ where: { id }, data });
}

export async function deleteBuyer(id: string) {
  await getBuyer(id);
  await prisma.buyer.delete({ where: { id } });
}

export async function listBuyerDemands(buyerId: string) {
  await getBuyer(buyerId);
  return prisma.buyerDemand.findMany({
    where: { buyerId },
    include: demandInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBuyerDemand(buyerId: string, demandId: string) {
  const demand = await prisma.buyerDemand.findFirst({
    where: { id: demandId, buyerId },
    include: demandInclude,
  });

  if (!demand) {
    throw new NotFoundError("Buyer demand not found");
  }

  return demand;
}

async function validateCrop(cropId: string) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId } });

  if (!crop) {
    throw new NotFoundError("Crop not found");
  }
}

export async function createBuyerDemand(buyerId: string, data: BuyerDemandInput) {
  await getBuyer(buyerId);
  await validateCrop(data.cropId);

  return prisma.buyerDemand.create({
    data: { buyerId, ...data },
    include: demandInclude,
  });
}

export async function updateBuyerDemand(
  buyerId: string,
  demandId: string,
  data: BuyerDemandInput,
) {
  await getBuyerDemand(buyerId, demandId);
  await validateCrop(data.cropId);

  return prisma.buyerDemand.update({
    where: { id: demandId },
    data,
    include: demandInclude,
  });
}

export async function deleteBuyerDemand(buyerId: string, demandId: string) {
  await getBuyerDemand(buyerId, demandId);
  await prisma.buyerDemand.delete({ where: { id: demandId } });
}

export async function listCropBuyerDemands(cropId: string, limit?: number) {
  await validateCrop(cropId);

  return prisma.buyerDemand.findMany({
    where: { cropId, status: "OPEN" },
    include: demandInclude,
    orderBy: [{ offeredPrice: "desc" }, { createdAt: "desc" }],
    ...(limit === undefined ? {} : { take: limit }),
  });
}