import { Router } from "express";
import {
  createSaleIntent,
  deleteSaleIntent,
  getSaleIntent,
  listSaleIntents,
  updateSaleIntent,
} from "../controllers/sale-intent.controller";

const saleIntentRouter = Router();

saleIntentRouter.get("/:farmerId/sale-intents", listSaleIntents);
saleIntentRouter.post("/:farmerId/sale-intents", createSaleIntent);
saleIntentRouter.get("/:farmerId/sale-intents/:id", getSaleIntent);
saleIntentRouter.put("/:farmerId/sale-intents/:id", updateSaleIntent);
saleIntentRouter.delete("/:farmerId/sale-intents/:id", deleteSaleIntent);

export default saleIntentRouter;