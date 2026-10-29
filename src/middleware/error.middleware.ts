import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/http-error";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      response.status(404).json({ success: false, message: "Resource not found" });
      return;
    }

    if (error.code === "P2002") {
      response.status(400).json({ success: false, message: "A record with these unique values already exists" });
      return;
    }
  }

  response.status(500).json({ success: false, message: "Internal server error" });
};