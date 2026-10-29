import { NextFunction, Request, Response } from "express";
import * as priceIntelligence from "../services/price-intelligence.service";
import { BadRequestError } from "../utils/http-error";

function parseId(value: unknown, label: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new BadRequestError(`${label} is invalid`);
  return value;
}

function parseLimit(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) <= 0) throw new BadRequestError("limit must be a positive integer");
  return Number(value);
}

export async function getPriceHistory(request: Request, response: Response, next: NextFunction) {
  try {
    const marketId = request.query.marketId === undefined ? undefined : parseId(request.query.marketId, "Market id");
    response.json({ success: true, data: await priceIntelligence.getPriceHistory(parseId(request.params.cropId, "Crop id"), marketId, parseLimit(request.query.limit)) });
  } catch (error) { next(error); }
}