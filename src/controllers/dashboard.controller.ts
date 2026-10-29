import { NextFunction, Request, Response } from "express";
import { getFarmerDashboard } from "../services/dashboard.service";
import { BadRequestError } from "../utils/http-error";

export async function getDashboard(request: Request, response: Response, next: NextFunction) {
  try {
    const id = Array.isArray(request.params.farmerId) ? request.params.farmerId[0] : request.params.farmerId;
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new BadRequestError("Farmer id is invalid");
    response.json({ success: true, data: await getFarmerDashboard(id) });
  } catch (error) { next(error); }
}