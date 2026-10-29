import { NextFunction, Request, Response } from "express";
import * as recommendationService from "../services/recommendation.service";
import { BadRequestError } from "../utils/http-error";

function parseId(value: unknown, label: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new BadRequestError(`${label} is invalid`);
  return value;
}

export async function getFarmerRecommendations(request: Request, response: Response, next: NextFunction) {
  try {
    const cropId = request.query.cropId === undefined ? undefined : parseId(request.query.cropId, "Crop id");
    response.json({ success: true, data: await recommendationService.getFarmerRecommendations(parseId(request.params.farmerId, "Farmer id"), cropId) });
  } catch (error) { next(error); }
}