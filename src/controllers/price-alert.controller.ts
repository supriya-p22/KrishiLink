import { NextFunction, Request, Response } from "express";
import * as priceAlertService from "../services/price-alert.service";
import { BadRequestError } from "../utils/http-error";

function parseId(value: unknown, label: string) {
  const id = typeof value === "string" ? value : "";
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new BadRequestError(`${label} is invalid`);
  return id;
}

function parsePrice(value: unknown) {
  const price = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(price) || price <= 0) throw new BadRequestError("targetPrice must be a positive number");
  return price;
}

function parseCondition(value: unknown) {
  if (typeof value !== "string" || !priceAlertService.isPriceAlertCondition(value)) {
    throw new BadRequestError("condition must be AT_OR_ABOVE or AT_OR_BELOW");
  }
  return value;
}

function parseCreateInput(body: unknown): priceAlertService.PriceAlertInput {
  if (!body || typeof body !== "object") throw new BadRequestError("Request body must be a JSON object");
  const input = body as Record<string, unknown>;
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  if (!unit) throw new BadRequestError("unit is required");
  if (input.active !== undefined && typeof input.active !== "boolean") throw new BadRequestError("active must be a boolean");
  const marketId = input.marketId === undefined || input.marketId === null ? null : parseId(input.marketId, "Market id");
  return { cropId: parseId(input.cropId, "Crop id"), marketId, targetPrice: parsePrice(input.targetPrice), condition: parseCondition(input.condition), unit, active: input.active ?? true };
}

function parseUpdateInput(body: unknown): priceAlertService.PriceAlertUpdateInput {
  if (!body || typeof body !== "object") throw new BadRequestError("Request body must be a JSON object");
  const input = body as Record<string, unknown>;
  const data: priceAlertService.PriceAlertUpdateInput = {};
  if (input.cropId !== undefined) data.cropId = parseId(input.cropId, "Crop id");
  if (input.marketId !== undefined) data.marketId = input.marketId === null ? null : parseId(input.marketId, "Market id");
  if (input.targetPrice !== undefined) data.targetPrice = parsePrice(input.targetPrice);
  if (input.condition !== undefined) data.condition = parseCondition(input.condition);
  if (input.unit !== undefined) {
    if (typeof input.unit !== "string" || !input.unit.trim()) throw new BadRequestError("unit must be a non-empty string");
    data.unit = input.unit.trim();
  }
  if (input.active !== undefined) {
    if (typeof input.active !== "boolean") throw new BadRequestError("active must be a boolean");
    data.active = input.active;
  }
  if (Object.keys(data).length === 0) throw new BadRequestError("At least one alert field is required");
  return data;
}

export async function createPriceAlert(request: Request, response: Response, next: NextFunction) {
  try { response.status(201).json({ success: true, data: await priceAlertService.createPriceAlert(parseId(request.params.farmerId, "Farmer id"), parseCreateInput(request.body)) }); } catch (error) { next(error); }
}
export async function listPriceAlerts(request: Request, response: Response, next: NextFunction) {
  try { response.json({ success: true, data: await priceAlertService.listFarmerPriceAlerts(parseId(request.params.farmerId, "Farmer id")) }); } catch (error) { next(error); }
}
export async function getPriceAlert(request: Request, response: Response, next: NextFunction) {
  try { response.json({ success: true, data: await priceAlertService.getFarmerPriceAlert(parseId(request.params.farmerId, "Farmer id"), parseId(request.params.id, "Price alert id")) }); } catch (error) { next(error); }
}
export async function updatePriceAlert(request: Request, response: Response, next: NextFunction) {
  try { response.json({ success: true, data: await priceAlertService.updateFarmerPriceAlert(parseId(request.params.farmerId, "Farmer id"), parseId(request.params.id, "Price alert id"), parseUpdateInput(request.body)) }); } catch (error) { next(error); }
}
export async function deletePriceAlert(request: Request, response: Response, next: NextFunction) {
  try { await priceAlertService.deleteFarmerPriceAlert(parseId(request.params.farmerId, "Farmer id"), parseId(request.params.id, "Price alert id")); response.json({ success: true, data: null }); } catch (error) { next(error); }
}
