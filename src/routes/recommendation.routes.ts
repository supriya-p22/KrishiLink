import { Router } from "express";
import { getFarmerRecommendations } from "../controllers/recommendation.controller";
const router = Router();
router.get("/:farmerId/recommendations", getFarmerRecommendations);
export default router;