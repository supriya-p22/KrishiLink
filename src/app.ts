import express from "express";
import apiRouter from "./routes/api.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Keep local Vite development able to call the API without opening production CORS.
const localFrontendOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
]);
app.use((request, response, next) => {
  const origin = request.header("origin");
  if (origin && localFrontendOrigins.has(origin)) {
    response.header("Access-Control-Allow-Origin", origin);
    response.header("Vary", "Origin");
    response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    response.header("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);

app.use(errorHandler);

export default app;
