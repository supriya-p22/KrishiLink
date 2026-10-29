import { Router } from "express";
import {
  comparePrices,
  findBestMarket,
} from "../controllers/price-discovery.controller";

const priceDiscoveryRouter = Router();

priceDiscoveryRouter.get("/compare", comparePrices);
priceDiscoveryRouter.get("/best-market/:cropId", findBestMarket);

export default priceDiscoveryRouter;