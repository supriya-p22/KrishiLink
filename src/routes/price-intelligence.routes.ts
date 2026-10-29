import { Router } from "express";
import { getPriceHistory } from "../controllers/price-intelligence.controller";
const router = Router();
router.get("/:cropId/price-history", getPriceHistory);
export default router;