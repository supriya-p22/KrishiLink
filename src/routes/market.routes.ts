import { Router } from "express";
import {
  createMarket,
  deleteMarket,
  getMarket,
  listMarketPrices,
  listMarkets,
  updateMarket,
} from "../controllers/market.controller";

const marketRouter = Router();

marketRouter.get("/", listMarkets);
marketRouter.post("/", createMarket);
marketRouter.get("/:marketId/prices", listMarketPrices);
marketRouter.get("/:id", getMarket);
marketRouter.put("/:id", updateMarket);
marketRouter.delete("/:id", deleteMarket);

export default marketRouter;