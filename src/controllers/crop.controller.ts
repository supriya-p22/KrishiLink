import { NextFunction, Request, Response } from "express";
import * as cropService from "../services/crop.service";
import { BadRequestError } from "../utils/http-error";

type CropInput = {
  name: string;
  category: string;
};

function parseCropInput(body: unknown): CropInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";

  if (!name || !category) {
    throw new BadRequestError("name and category are required and must be non-empty strings");
  }

  return { name, category };
}

function parseCropId(id: string | string[]): string {
  const cropId = Array.isArray(id) ? id[0] : id;

  if (!cropId) {
    throw new BadRequestError("Crop id is required");
  }

  return cropId;
}

export async function listCrops(_request: Request, response: Response, next: NextFunction) {
  try {
    const crops = await cropService.listCrops();
    response.json({ success: true, data: crops });
  } catch (error) {
    next(error);
  }
}

export async function getCrop(request: Request, response: Response, next: NextFunction) {
  try {
    const crop = await cropService.getCrop(parseCropId(request.params.id));
    response.json({ success: true, data: crop });
  } catch (error) {
    next(error);
  }
}

export async function createCrop(request: Request, response: Response, next: NextFunction) {
  try {
    const crop = await cropService.createCrop(parseCropInput(request.body));
    response.status(201).json({ success: true, data: crop });
  } catch (error) {
    next(error);
  }
}

export async function updateCrop(request: Request, response: Response, next: NextFunction) {
  try {
    const crop = await cropService.updateCrop(parseCropId(request.params.id), parseCropInput(request.body));
    response.json({ success: true, data: crop });
  } catch (error) {
    next(error);
  }
}

export async function deleteCrop(request: Request, response: Response, next: NextFunction) {
  try {
    await cropService.deleteCrop(parseCropId(request.params.id));
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}