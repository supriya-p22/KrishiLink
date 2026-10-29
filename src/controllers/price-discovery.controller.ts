import { NextFunction, Request, Response } from "express";
import * as discoveryService from "../services/price-discovery.service";
import { BadRequestError } from "../utils/http-error";

function parseQueryValue(value: unknown, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return value.trim();
}

function parseId(value: unknown, label: string): string {
  const id = parseQueryValue(value, label);

  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return id;
}

function parseLimit(value: unknown): number | undefined {
  const limit = parseQueryValue(value, "limit");

  if (limit === undefined) {
    return undefined;
  }

  const numericLimit = Number(limit);

  if (!/^\d+$/.test(limit) || !Number.isSafeInteger(numericLimit) || numericLimit <= 0) {
    throw new BadRequestError("limit must be a positive integer");
  }

  return numericLimit;
}

function parseSort(value: unknown): discoveryService.PriceDiscoverySort {
  const sort = parseQueryValue(value, "sort") ?? "latest";

  if (sort !== "price_asc" && sort !== "price_desc" && sort !== "latest") {
    throw new BadRequestError("sort must be one of price_asc, price_desc, or latest");
  }

  return sort;
}

export async function comparePrices(request: Request, response: Response, next: NextFunction) {
  try {
    const cropId = request.query.cropId === undefined
      ? undefined
      : parseId(request.query.cropId, "cropId");
    const marketId = request.query.marketId === undefined
      ? undefined
      : parseId(request.query.marketId, "marketId");
    const data = await discoveryService.comparePrices({
      cropId,
      marketId,
      limit: parseLimit(request.query.limit),
      sort: parseSort(request.query.sort),
    });

    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function findBestMarket(request: Request, response: Response, next: NextFunction) {
  try {
    const cropId = parseId(request.params.cropId, "Crop id");
    const data = await discoveryService.findBestMarket(cropId);

    response.json({
      success: true,
      data,
      ...(data ? {} : { message: "No price records found for crop" }),
    });
  } catch (error) {
    next(error);
  }
}