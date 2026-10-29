import { Router } from "express";
import {
  createFarmer,
  createFarmerCrop,
  deleteFarmer,
  deleteFarmerCrop,
  getFarmer,
  getFarmerCrop,
  listFarmerCrops,
  listFarmers,
  updateFarmer,
  updateFarmerCrop,
} from "../controllers/farmer.controller";

const farmerRouter = Router();

farmerRouter.get("/", listFarmers);
farmerRouter.post("/", createFarmer);
farmerRouter.get("/:id", getFarmer);
farmerRouter.put("/:id", updateFarmer);
farmerRouter.delete("/:id", deleteFarmer);

farmerRouter.get("/:farmerId/crops", listFarmerCrops);
farmerRouter.post("/:farmerId/crops", createFarmerCrop);
farmerRouter.get("/:farmerId/crops/:listingId", getFarmerCrop);
farmerRouter.put("/:farmerId/crops/:listingId", updateFarmerCrop);
farmerRouter.delete("/:farmerId/crops/:listingId", deleteFarmerCrop);

export default farmerRouter;