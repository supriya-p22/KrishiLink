import { Router } from "express";
import {
  createBuyer,
  createBuyerDemand,
  deleteBuyer,
  deleteBuyerDemand,
  getBuyer,
  getBuyerDemand,
  listBuyerDemands,
  listBuyers,
  listCropBuyerDemands,
  updateBuyer,
  updateBuyerDemand,
} from "../controllers/buyer.controller";

const buyerRouter = Router();

buyerRouter.get("/", listBuyers);
buyerRouter.post("/", createBuyer);
buyerRouter.get("/:buyerId/demands", listBuyerDemands);
buyerRouter.post("/:buyerId/demands", createBuyerDemand);
buyerRouter.get("/:buyerId/demands/:demandId", getBuyerDemand);
buyerRouter.put("/:buyerId/demands/:demandId", updateBuyerDemand);
buyerRouter.delete("/:buyerId/demands/:demandId", deleteBuyerDemand);
buyerRouter.get("/:id", getBuyer);
buyerRouter.put("/:id", updateBuyer);
buyerRouter.delete("/:id", deleteBuyer);

export default buyerRouter;