import { Router } from "express";
import {
  createCrop,
  deleteCrop,
  getCrop,
  listCrops,
  updateCrop,
} from "../controllers/crop.controller";

const cropRouter = Router();

cropRouter.get("/", listCrops);
cropRouter.get("/:id", getCrop);
cropRouter.post("/", createCrop);
cropRouter.put("/:id", updateCrop);
cropRouter.delete("/:id", deleteCrop);

export default cropRouter;