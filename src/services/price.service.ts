import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type PriceInput = {
  marketId: string;
  cropId: string;
  price: number;
  unit: string;
  recordedAt: Date;
};

const priceInclude = {
  market: true,
  crop: true,
};

export function listPrices() {
  return prisma.marketPrice.findMany({
    include: priceInclude,
    orderBy: { recordedAt: "desc" },
  });
}

export async function getPrice(id: string) {
  const price = await prisma.marketPrice.findUnique({
    where: { id },
    include: priceInclude,
  });

  if (!price) {
    throw new NotFoundError("Price record not found");
  }

  return price;
}

async function validateReferences(marketId: string, cropId: string) {
  const [market, crop] = await Promise.all([
    prisma.market.findUnique({ where: { id: marketId } }),
    prisma.crop.findUnique({ where: { id: cropId } }),
  ]);

  if (!market) {
    throw new NotFoundError("Market not found");
  }

  if (!crop) {
    throw new NotFoundError("Crop not found");
  }
}

export async function createPrice(data: PriceInput) {
  await validateReferences(data.marketId, data.cropId);
  return prisma.marketPrice.create({ data, include: priceInclude });
}

export async function updatePrice(id: string, data: PriceInput) {
  await getPrice(id);
  await validateReferences(data.marketId, data.cropId);
  return prisma.marketPrice.update({ where: { id }, data, include: priceInclude });
}

export async function deletePrice(id: string) {
  await getPrice(id);
  await prisma.marketPrice.delete({ where: { id } });
}

export async function listPricesByCrop(cropId: string) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId } });

  if (!crop) {
    throw new NotFoundError("Crop not found");
  }

  return prisma.marketPrice.findMany({
    where: { cropId },
    include: { market: true, crop: true },
    orderBy: { recordedAt: "desc" },
  });
}

export async function listPricesByMarket(marketId: string) {
  const market = await prisma.market.findUnique({ where: { id: marketId } });

  if (!market) {
    throw new NotFoundError("Market not found");
  }

  return prisma.marketPrice.findMany({
    where: { marketId },
    include: { market: true, crop: true },
    orderBy: { recordedAt: "desc" },
  });
}