import { NextFunction, Request, Response } from "express";
import * as opportunityService from "../services/opportunity-matching.service";
import { BadRequestError } from "../utils/http-error";

function parseId(value: unknown, label: string) {
  const id = typeof value === "string" ? value : "";

  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new BadRequestError(`${label} is invalid`);
  }

  return id;
}

function parseLimit(value: unknown) {
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

export async function findFarmerOpportunities(request: Request, response: Response, next: NextFunction) {
  try {
    const farmerId = parseId(request.params.farmerId, "Farmer id");
    const cropId = request.query.cropId === undefined
      ? undefined
      : parseId(request.query.cropId, "Crop id");

    const data = await opportunityService.findFarmerOpportunities(farmerId, {
      cropId,
      limit: parseLimit(request.query.limit),
    });

    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}