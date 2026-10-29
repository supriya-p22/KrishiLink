import { NextFunction, Request, Response } from "express";
import * as marketService from "../services/market.service";
import * as priceService from "../services/price.service";
import { BadRequestError } from "../utils/http-error";

function parseId(id: string | string[], label: string): string {
  const value = Array.isArray(id) ? id[0] : id;

  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return value;
}

function parseMarketInput(body: unknown): marketService.MarketInput {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const location = typeof input.location === "string" ? input.location.trim() : "";

  if (!name || !location) {
    throw new BadRequestError("name and location are required and must be non-empty strings");
  }

  return { name, location };
}

export async function listMarkets(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json({ success: true, data: await marketService.listMarkets() });
  } catch (error) {
    next(error);
  }
}

export async function getMarket(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await marketService.getMarket(parseId(request.params.id, "Market id")),
    });
  } catch (error) {
    next(error);
  }
}

export async function createMarket(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({
      success: true,
      data: await marketService.createMarket(parseMarketInput(request.body)),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMarket(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await marketService.updateMarket(
        parseId(request.params.id, "Market id"),
        parseMarketInput(request.body),
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMarket(request: Request, response: Response, next: NextFunction) {
  try {
    await marketService.deleteMarket(parseId(request.params.id, "Market id"));
    response.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function listMarketPrices(request: Request, response: Response, next: NextFunction) {
  try {
    response.json({
      success: true,
      data: await priceService.listPricesByMarket(parseId(request.params.marketId, "Market id")),
    });
  } catch (error) {
    next(error);
  }
}