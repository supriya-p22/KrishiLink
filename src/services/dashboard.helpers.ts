import { findFarmerOpportunities } from "./opportunity-matching.service";

export function getFarmerOpportunities(farmerId: string) {
  return findFarmerOpportunities(farmerId, { });
}