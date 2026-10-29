import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type MarketInput = {
  name: string;
  location: string;
};

export function listMarkets() {
  return prisma.market.findMany({ orderBy: [{ name: "asc" }, { location: "asc" }] });
}

export async function getMarket(id: string) {
  const market = await prisma.market.findUnique({ where: { id } });

  if (!market) {
    throw new NotFoundError("Market not found");
  }

  return market;
}

export function createMarket(data: MarketInput) {
  return prisma.market.create({ data });
}

export async function updateMarket(id: string, data: MarketInput) {
  await getMarket(id);
  return prisma.market.update({ where: { id }, data });
}

export async function deleteMarket(id: string) {
  await getMarket(id);
  await prisma.market.delete({ where: { id } });
}