import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";
import { calculatePriceChange } from "./price-intelligence.service";

export async function compareCropMarkets(cropId: string, marketId?: string, limit?: number) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop) throw new NotFoundError("Crop not found");
  if (marketId && !await prisma.market.findUnique({ where: { id: marketId } })) throw new NotFoundError("Market not found");
  const now = new Date();
  const [rows, buyerDemand] = await Promise.all([prisma.marketPrice.findMany({ where: { cropId, ...(marketId ? { marketId } : {}) }, include: { market: true }, orderBy: { recordedAt: "desc" } }), prisma.buyerDemand.findFirst({ where: { cropId, status: "OPEN", OR: [{ validUntil: null }, { validUntil: { gt: now } }] } })]);
  const latest = new Map<string, typeof rows[number]>(), previous = new Map<string, typeof rows[number]>();
  for (const row of rows) if (!latest.has(row.marketId)) latest.set(row.marketId, row); else if (!previous.has(row.marketId)) previous.set(row.marketId, row);
  const ranked = [...latest.values()].sort((a,b) => Number(b.modalPrice ?? b.price)-Number(a.modalPrice ?? a.price) || b.recordedAt.getTime()-a.recordedAt.getTime() || a.market.name.localeCompare(b.market.name) || a.marketId.localeCompare(b.marketId));
  const best = ranked[0], bestValue = best ? Number(best.modalPrice ?? best.price) : null;
  const make = (row: typeof rows[number]) => { const value=Number(row.modalPrice ?? row.price), prior=previous.get(row.marketId), change=calculatePriceChange(value, prior ? Number(prior.modalPrice ?? prior.price) : null); return { market: row.market, currentModalPrice: row.modalPrice ?? row.price, minPrice: row.minPrice, maxPrice: row.maxPrice, unit: row.unit, arrivalDate: row.arrivalDate, recordedAt: row.recordedAt, variety: row.variety, grade: row.grade, trend: prior ? change.trend : null, priceChange: prior ? change.absoluteChange : null, priceDifferenceFromBest: bestValue === null ? null : bestValue-value, percentageDifferenceFromBest: bestValue ? (bestValue-value)/bestValue*100 : null, buyerDemandAvailable: Boolean(buyerDemand) }; };
  const selected = limit === undefined ? ranked : ranked.slice(0, limit);
  return { crop, bestMarket: best ? make(best) : null, markets: selected.map(make) };
}
