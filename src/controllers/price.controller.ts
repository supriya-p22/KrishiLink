import { NextFunction, Request, Response } from "express";
import * as priceService from "../services/price.service";
import { BadRequestError } from "../utils/http-error";

function parseId(id: string | string[], label: string): string {
  const value = Array.isArray(id) ? id[0] : id;

  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return value;
}

function parsePriceInput(body: unknown): priceService.PriceInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const marketId = typeof input.marketId === "string" ? input.marketId.trim() : "";
  const cropId = typeof input.cropId === "string" ? input.cropId.trim() : "";
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  const price = typeof input.price === "number"
    ? input.price
    : typeof input.price === "string" && input.price.trim() !== ""
      ? Number(input.price)
      : Number.NaN;
  const recordedAt = typeof input.recordedAt === "string" ? new Date(input.recordedAt) : new Date(Number.NaN);

  if (!marketId || !cropId || !unit || !Number.isFinite(price) || price <= 0) {
    throw new BadRequestError("marketId, cropId, and unit are required; price must be a positive number");
  }

  if (Number.isNaN(recordedAt.getTime())) {
    throw new BadRequestError("recordedAt must be a valid date-time string");
  }

  return { marketId, cropId, price, unit, recordedAt };
}

export async function listPrices(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await priceService.listPrices() });
  } catch (error) {
    next(error);
  }
}

export async function getPrice(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await priceService.getPrice(parseId(request.params.id, "Price id")),
    });
  } catch (error) {
    next(error);
  }
}

export async function createPrice(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({
      success: true,
      data: await priceService.createPrice(parsePriceInput(request.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePrice(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await priceService.updatePrice(
        parseId(request.params.id, "Price id"),
        parsePriceInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePrice(request: Request, response: Response, next: NextFunction) {
  try {
    await priceService.deletePrice(parseId(request.params.id, "Price id"));
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function listCropPrices(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await priceService.listPricesByCrop(parseId(request.params.cropId, "Crop id")),
    });
  } catch (error) {
    next(error);
  }
}