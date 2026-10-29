import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/http-error";
import { addFreshness } from "./freshness.service";
import { getFarmerOpportunities } from "./dashboard.helpers";
import { getFarmerRecommendations } from "./recommendation.service";
import { listFarmerSaleIntents } from "./sale-intent.service";

export async function getFarmerDashboard(farmerId: string) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId }, include: { user: true, farmerCrops: { include: { crop: true } } } });
  if (!farmer) throw new NotFoundError("Farmer not found");
  const cropIds = farmer.farmerCrops.map((listing) => listing.cropId);
  const [opportunities, recommendations, saleIntents] = await Promise.all([
    getFarmerOpportunities(farmerId),
    getFarmerRecommendations(farmerId),
    listFarmerSaleIntents(farmerId, {}),
  ]);
  const priceTrends = await Promise.all(cropIds.map(async (cropId) => {
    const rows = await prisma.marketPrice.findMany({ where: { cropId }, include: { market: true }, orderBy: [{ arrivalDate: "asc" }, { recordedAt: "asc" }] });
    return { cropId, observations: rows, latest: rows.at(-1)?.modalPrice ?? rows.at(-1)?.price ?? null, previous: rows.at(-2)?.modalPrice ?? rows.at(-2)?.price ?? null };
  }));
  return { farmer: { id: farmer.id, location: farmer.location, user: farmer.user }, cropListings: farmer.farmerCrops.map((listing) => addFreshness(listing)), recommendations, opportunities: opportunities.opportunities, priceTrends, saleIntents };
}