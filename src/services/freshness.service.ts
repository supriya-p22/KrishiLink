export type FreshnessCategory = "FRESH" | "MODERATE" | "AGING" | "UNKNOWN";

export type Freshness = {
  category: FreshnessCategory;
  daysSinceHarvest: number | null;
  harvestDate: Date | null;
};

export function calculateFreshness(harvestDate: Date | null, now = new Date()): Freshness {
  if (!harvestDate) {
    return { category: "UNKNOWN", daysSinceHarvest: null, harvestDate: null };
  }

  const daysSinceHarvest = Math.floor((now.getTime() - harvestDate.getTime()) / 86_400_000);

  if (daysSinceHarvest < 0) {
    throw new Error("Harvest date cannot be in the future");
  }

  return {
    category: daysSinceHarvest <= 3 ? "FRESH" : daysSinceHarvest <= 7 ? "MODERATE" : "AGING",
    daysSinceHarvest,
    harvestDate,
  };
}

export function addFreshness<T extends { harvestDate: Date | null }>(listing: T, now = new Date()) {
  return { ...listing, freshness: calculateFreshness(listing.harvestDate, now) };
}