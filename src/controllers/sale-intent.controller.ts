import { NextFunction, Request, Response } from "express";
import * as saleIntentService from "../services/sale-intent.service";
import { BadRequestError } from "../utils/http-error";

function parseId(value: unknown, label: string): string {
  const id = typeof value === "string" ? value : "";

  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return id;
}

function parseQuantity(value: unknown): number {
  const quantity = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new BadRequestError("quantity must be positive");
  }

  return quantity;
}

function parseStatus(value: unknown): saleIntentService.SaleIntentStatus {
  if (typeof value !== "string" || !saleIntentService.isSaleIntentStatus(value)) {
    throw new BadRequestError("status must be one of PENDING, ACCEPTED, REJECTED, COMPLETED, or CANCELLED");
  }

  return value;
}

function parseOptionalStatus(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return parseStatus(value);
}

export async function createSaleIntent(request: Request, response: Response, next: NextFunction) {
  try {
    const body = request.body && typeof request.body === "object"
      ? request.body as Record<string, unknown>
      : {};

    response.status(201).json({
      success: true,
      data: await saleIntentService.createSaleIntent(
        parseId(request.params.farmerId, "Farmer id"),
        parseId(body.farmerCropId, "Farmer crop id"),
        parseId(body.buyerDemandId, "Buyer demand id"),
        parseQuantity(body.quantity),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function listSaleIntents(request: Request, response: Response, next: NextFunction) {
  try {
    const cropId = request.query.cropId === undefined
      ? undefined
      : parseId(request.query.cropId, "Crop id");

    response.json({
      success: true,
      data: await saleIntentService.listFarmerSaleIntents(
        parseId(request.params.farmerId, "Farmer id"),
        { status: parseOptionalStatus(request.query.status), cropId },
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSaleIntent(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await saleIntentService.getFarmerSaleIntent(
        parseId(request.params.farmerId, "Farmer id"),
        parseId(request.params.id, "Sale intent id"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSaleIntent(request: Request, response: Response, next: NextFunction) {
  try {
    const body = request.body && typeof request.body === "object"
      ? request.body as Record<string, unknown>
      : {};

    response.json({
      success: true,
      data: await saleIntentService.updateFarmerSaleIntent(
        parseId(request.params.farmerId, "Farmer id"),
        parseId(request.params.id, "Sale intent id"),
        parseStatus(body.status),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSaleIntent(request: Request, response: Response, next: NextFunction) {
  try {
    await saleIntentService.deleteFarmerSaleIntent(
      parseId(request.params.farmerId, "Farmer id"),
      parseId(request.params.id, "Sale intent id"),
    );
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}