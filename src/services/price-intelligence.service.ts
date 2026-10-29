import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";

export type PriceTrend = "RISING" | "FALLING" | "STABLE";

export function calculatePriceChange(current: number, previous: number | null) {
  if (previous === null) return { absoluteChange: null, percentageChange: null, trend: "STABLE" as PriceTrend };
  const absoluteChange = current - previous;
  const percentageChange = previous === 0 ? null : (absoluteChange / previous) * 100;
  const trend = Math.abs(absoluteChange) < 0.01 ? "STABLE" : absoluteChange > 0 ? "RISING" : "FALLING";
  return { absoluteChange, percentageChange, trend: trend as PriceTrend };
}

export async function getPriceHistory(cropId: string, marketId?: string, limit?: number) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop) throw new NotFoundError("Crop not found");
  const rows = await prisma.marketPrice.findMany({
    where: { cropId, ...(marketId ? { marketId } : {}) },
    include: { market: true },
    orderBy: [{ arrivalDate: "asc" }, { recordedAt: "asc" }],
    ...(limit ? { take: limit } : {}),
  });
  const observations = rows.map((row) => ({
    arrivalDate: row.arrivalDate,
    recordedAt: row.recordedAt,
    minPrice: row.minPrice ?? row.price,
    maxPrice: row.maxPrice ?? row.price,
    modalPrice: row.modalPrice ?? row.price,
    market: row.market,
    variety: row.variety,
    grade: row.grade,
  }));
  const current = observations.at(-1)?.modalPrice;
  const previous = observations.at(-2)?.modalPrice ?? null;
  const change = calculatePriceChange(current ? Number(current) : 0, previous === null ? null : Number(previous));
  return { crop, observations, latestModalPrice: current ?? null, previousModalPrice: previous, ...change };
}