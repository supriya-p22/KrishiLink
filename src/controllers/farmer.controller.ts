import { NextFunction, Request, Response } from "express";
import * as farmerService from "../services/farmer.service";
import { BadRequestError } from "../utils/http-error";

function parseId(id: string | string[], label: string): string {
  const value = Array.isArray(id) ? id[0] : id;
  if (!value) {
    throw new BadRequestError(`${label} is required`);
  }
  return value;
}

function parseFarmerInput(body: unknown): farmerService.FarmerInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";
  const phone = input.phone === undefined ? undefined : typeof input.phone === "string" ? input.phone.trim() : "";
  const email = input.email === undefined ? undefined : typeof input.email === "string" ? input.email.trim() : "";

  if (!name || !location || phone === "" || email === "") {
    throw new BadRequestError("name and location are required; phone and email must be strings when provided");
  }

  return { name, location, phone, email };
}

function parseFarmerCropInput(body: unknown): farmerService.FarmerCropInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const cropId = typeof input.cropId === "string" ? input.cropId.trim() : "";
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  const harvestDate = input.harvestDate === undefined
    ? undefined
    : input.harvestDate === null
      ? null
    : typeof input.harvestDate === "string" ? new Date(input.harvestDate) : new Date(Number.NaN);
  const quantity = typeof input.quantity === "number"
    ? input.quantity
    : typeof input.quantity === "string" && input.quantity.trim() !== ""
      ? Number(input.quantity)
      : Number.NaN;

  if (!cropId || !unit || !Number.isFinite(quantity) || quantity <= 0) {
    throw new BadRequestError("cropId and unit are required; quantity must be a positive number");
  }

  if (harvestDate && Number.isNaN(harvestDate.getTime())) {
    throw new BadRequestError("harvestDate must be a valid ISO date");
  }

  if (harvestDate && harvestDate > new Date()) {
    throw new BadRequestError("harvestDate cannot be in the future");
  }

  return { cropId, quantity, unit, harvestDate };
}

export async function listFarmers(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await farmerService.listFarmers() });
  } catch (error) {
    next(error);
  }
}

export async function getFarmer(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await farmerService.getFarmer(parseId(request.params.id, "Farmer id")) });
  } catch (error) {
    next(error);
  }
}

export async function createFarmer(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ success: true, data: await farmerService.createFarmer(parseFarmerInput(request.body)) });
  } catch (error) {
    next(error);
  }
}

export async function updateFarmer(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await farmerService.updateFarmer(parseId(request.params.id, "Farmer id"), parseFarmerInput(request.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFarmer(request: Request, response: Response, next: NextFunction) {
  try {
    await farmerService.deleteFarmer(parseId(request.params.id, "Farmer id"));
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function listFarmerCrops(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await farmerService.listFarmerCrops(parseId(request.params.farmerId, "Farmer id")),
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmerCrop(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await farmerService.getFarmerCrop(
        parseId(request.params.farmerId, "Farmer id"),
        parseId(request.params.listingId, "Listing id"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createFarmerCrop(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({
      success: true,
      data: await farmerService.createFarmerCrop(
        parseId(request.params.farmerId, "Farmer id"),
        parseFarmerCropInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFarmerCrop(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await farmerService.updateFarmerCrop(
        parseId(request.params.farmerId, "Farmer id"),
        parseId(request.params.listingId, "Listing id"),
        parseFarmerCropInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFarmerCrop(request: Request, response: Response, next: NextFunction) {
  try {
    await farmerService.deleteFarmerCrop(
      parseId(request.params.farmerId, "Farmer id"),
      parseId(request.params.listingId, "Listing id"),
    );
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}