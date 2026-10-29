import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";
import { calculateFreshness } from "./freshness.service";
import { calculatePriceChange, PriceTrend } from "./price-intelligence.service";

// M16 deterministic weights (total 100): value 35, quantity 20, freshness 20, trend 10, relevance 15.
const WEIGHTS = { price: 35, quantityCompatibility: 20, freshness: 20, trend: 10, demand: 15 } as const;
const freshnessScore = (category: string) => category === "FRESH" ? 20 : category === "MODERATE" ? 14 : category === "AGING" ? 8 : 10;
const trendScore = (trend: PriceTrend) => trend === "RISING" ? 10 : trend === "FALLING" ? 0 : 5;

export async function getFarmerRecommendations(farmerId: string, cropId?: string) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId } });
  if (!farmer) throw new NotFoundError("Farmer not found");
  const listings = await prisma.farmerCrop.findMany({ where: { farmerId, ...(cropId ? { cropId } : {}) }, include: { crop: true } });
  const now = new Date();
  const results: Array<Record<string, unknown>> = [];
  for (const listing of listings) {
    const freshness = calculateFreshness(listing.harvestDate, now);
    const [prices, demands] = await Promise.all([
      prisma.marketPrice.findMany({ where: { cropId: listing.cropId, unit: listing.unit }, include: { market: true }, orderBy: { recordedAt: "desc" } }),
      prisma.buyerDemand.findMany({ where: { cropId: listing.cropId, unit: listing.unit, status: "OPEN", OR: [{ validUntil: null }, { validUntil: { gt: now } }] }, include: { buyer: true }, orderBy: { createdAt: "desc" } }),
    ]);
    const latestByMarket = new Map<string, typeof prices[number]>();
    for (const price of prices) if (!latestByMarket.has(price.marketId)) latestByMarket.set(price.marketId, price);
    const trend = calculatePriceChange(prices[0] ? Number(prices[0].modalPrice ?? prices[0].price) : 0, prices[1] ? Number(prices[1].modalPrice ?? prices[1].price) : null).trend;
    const raw = [
      ...demands.map((demand) => ({ type: "BUYER" as const, price: Number(demand.offeredPrice), timestamp: demand.createdAt, buyer: demand.buyer, demand, quantityCompatible: Number(demand.quantity) >= Number(listing.quantity), relevance: 15 })),
      ...Array.from(latestByMarket.values()).map((price) => ({ type: "MARKET" as const, price: Number(price.modalPrice ?? price.price), timestamp: price.recordedAt, market: price.market, priceRecord: price, quantityCompatible: false, relevance: 8 })),
    ];
    const maxPrice = Math.max(...raw.map((item) => item.price), 0);
    const opportunities = raw.map((item) => {
      const scoreBreakdown = { price: maxPrice ? item.price / maxPrice * WEIGHTS.price : 0, quantityCompatibility: item.type === "BUYER" && item.quantityCompatible ? 20 : 0, freshness: freshnessScore(freshness.category), trend: trendScore(trend), demand: item.relevance };
      const score = Math.max(0, Math.min(100, Object.values(scoreBreakdown).reduce((total, value) => total + value, 0)));
      const recommendationReasons = [item.type === "BUYER" ? "Open buyer demand available" : "Latest market price observation", item.type === "BUYER" && item.quantityCompatible ? "Buyer demand matches your quantity" : undefined, freshness.category === "FRESH" ? "Fresh crop" : freshness.category === "AGING" ? "Crop is aging" : undefined, trend === "RISING" ? "Price is rising" : trend === "FALLING" ? "Price is falling" : undefined, maxPrice > 0 && item.price === maxPrice ? `Higher ${item.type === "BUYER" ? "buyer" : "market"} price` : undefined].filter((reason): reason is string => Boolean(reason));
      return { ...item, effectivePrice: item.price, score, recommendationScore: score, scoreBreakdown, recommendationReasons, keyReasons: recommendationReasons, freshness, trend };
    }).sort((a, b) => b.score - a.score || b.effectivePrice - a.effectivePrice || b.timestamp.getTime() - a.timestamp.getTime());
    results.push({ crop: listing.crop, farmerQuantity: listing.quantity, farmerUnit: listing.unit, freshness, opportunities });
  }
  return results;
}
