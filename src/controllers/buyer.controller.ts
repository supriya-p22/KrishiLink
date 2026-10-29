import { NextFunction, Request, Response } from "express";
import * as buyerService from "../services/buyer.service";
import { BadRequestError } from "../utils/http-error";

const validStatuses = new Set(["OPEN", "CLOSED", "FILLED", "EXPIRED"]);

function parseId(value: string | string[], label: string): string {
  const id = Array.isArray(value) ? value[0] : value;

  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return id;
}

function parseBuyerInput(body: unknown): buyerService.BuyerInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const type = typeof input.type === "string" ? input.type.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";
  const contact = input.contact === undefined
    ? undefined
    : typeof input.contact === "string"
      ? input.contact.trim()
      : "";

  if (!name || !type || !location || contact === "") {
    throw new BadRequestError("name, type, and location are required; contact must be a string when provided");
  }

  return { name, type, location, contact };
}

function parseDemandInput(body: unknown): buyerService.BuyerDemandInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const cropId = typeof input.cropId === "string" ? input.cropId.trim() : "";
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  const status = typeof input.status === "string" ? input.status.trim().toUpperCase() : "";
  const quantity = typeof input.quantity === "number"
    ? input.quantity
    : typeof input.quantity === "string" && input.quantity.trim() !== ""
      ? Number(input.quantity)
      : Number.NaN;
  const offeredPrice = typeof input.offeredPrice === "number"
    ? input.offeredPrice
    : typeof input.offeredPrice === "string" && input.offeredPrice.trim() !== ""
      ? Number(input.offeredPrice)
      : Number.NaN;
  let validUntil: Date | null = null;

  if (input.validUntil !== undefined && input.validUntil !== null) {
    if (typeof input.validUntil !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(input.validUntil)) {
      throw new BadRequestError("validUntil must be a valid ISO date");
    }

    validUntil = new Date(input.validUntil);

    if (Number.isNaN(validUntil.getTime())) {
      throw new BadRequestError("validUntil must be a valid ISO date");
    }
  }

  if (!cropId || !unit || !Number.isFinite(quantity) || quantity <= 0) {
    throw new BadRequestError("cropId and unit are required; quantity must be positive");
  }

  if (!Number.isFinite(offeredPrice) || offeredPrice <= 0) {
    throw new BadRequestError("offeredPrice must be positive");
  }

  if (!status || !validStatuses.has(status)) {
    throw new BadRequestError("status must be one of OPEN, CLOSED, FILLED, or EXPIRED");
  }

  return { cropId, quantity, unit, offeredPrice, status, validUntil };
}

function parseLimit(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new BadRequestError("limit must be a positive integer");
  }

  const limit = Number(value);

  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new BadRequestError("limit must be a positive integer");
  }

  return limit;
}

export async function listBuyers(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await buyerService.listBuyers() });
  } catch (error) {
    next(error);
  }
}

export async function getBuyer(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await buyerService.getBuyer(parseId(request.params.id, "Buyer id")) });
  } catch (error) {
    next(error);
  }
}

export async function createBuyer(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ success: true, data: await buyerService.createBuyer(parseBuyerInput(request.body)) });
  } catch (error) {
    next(error);
  }
}

export async function updateBuyer(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await buyerService.updateBuyer(parseId(request.params.id, "Buyer id"), parseBuyerInput(request.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBuyer(request: Request, response: Response, next: NextFunction) {
  try {
    await buyerService.deleteBuyer(parseId(request.params.id, "Buyer id"));
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function listBuyerDemands(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await buyerService.listBuyerDemands(parseId(request.params.buyerId, "Buyer id")),
    });
  } catch (error) {
    next(error);
  }
}

export async function getBuyerDemand(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await buyerService.getBuyerDemand(
        parseId(request.params.buyerId, "Buyer id"),
        parseId(request.params.demandId, "Demand id"),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createBuyerDemand(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({
      success: true,
      data: await buyerService.createBuyerDemand(
        parseId(request.params.buyerId, "Buyer id"),
        parseDemandInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBuyerDemand(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await buyerService.updateBuyerDemand(
        parseId(request.params.buyerId, "Buyer id"),
        parseId(request.params.demandId, "Demand id"),
        parseDemandInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBuyerDemand(request: Request, response: Response, next: NextFunction) {
  try {
    await buyerService.deleteBuyerDemand(
      parseId(request.params.buyerId, "Buyer id"),
      parseId(request.params.demandId, "Demand id"),
    );
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function listCropBuyerDemands(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await buyerService.listCropBuyerDemands(
        parseId(request.params.cropId, "Crop id"),
        parseLimit(request.query.limit),
      ),
    });
  } catch (error) {
    next(error);
  }
}