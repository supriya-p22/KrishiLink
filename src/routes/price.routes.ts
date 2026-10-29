import { Router } from "express";
import {
  createPrice,
  deletePrice,
  getPrice,
  listPrices,
  updatePrice,
} from "../controllers/price.controller";

const priceRouter = Router();

priceRouter.get("/", listPrices);
priceRouter.post("/", createPrice);
priceRouter.get("/:id", getPrice);
priceRouter.put("/:id", updatePrice);
priceRouter.delete("/:id", deletePrice);

export default priceRouter;