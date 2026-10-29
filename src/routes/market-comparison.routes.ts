import { Router } from "express";
import { getMarketComparison } from "../controllers/market-comparison.controller";
const router=Router(); router.get("/:cropId/market-comparison",getMarketComparison); export default router;
