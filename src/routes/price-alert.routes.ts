import { Router } from "express";
import { createPriceAlert, deletePriceAlert, getPriceAlert, listPriceAlerts, updatePriceAlert } from "../controllers/price-alert.controller";

const router = Router();
router.get("/:farmerId/price-alerts", listPriceAlerts);
router.post("/:farmerId/price-alerts", createPriceAlert);
router.get("/:farmerId/price-alerts/:id", getPriceAlert);
router.put("/:farmerId/price-alerts/:id", updatePriceAlert);
router.delete("/:farmerId/price-alerts/:id", deletePriceAlert);

export default router;
