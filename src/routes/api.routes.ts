import { Router } from "express";
import buyerRouter from "./buyer.routes";
import cropRouter from "./crop.routes";
import farmerRouter from "./farmer.routes";
import marketRouter from "./market.routes";
import opportunityMatchingRouter from "./opportunity-matching.routes";
import priceRouter from "./price.routes";
import priceDiscoveryRouter from "./price-discovery.routes";
import saleIntentRouter from "./sale-intent.routes";
import priceIntelligenceRouter from "./price-intelligence.routes";
import recommendationRouter from "./recommendation.routes";
import dashboardRouter from "./dashboard.routes";
import priceAlertRouter from "./price-alert.routes";
import marketComparisonRouter from "./market-comparison.routes";
import { listCropBuyerDemands } from "../controllers/buyer.controller";
import { listCropPrices } from "../controllers/price.controller";

const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "KrishiLink API" });
});

apiRouter.use("/crops", cropRouter);
apiRouter.use("/crops", marketComparisonRouter);
apiRouter.get("/crops/:cropId/buyers", listCropBuyerDemands);
apiRouter.use("/farmers", farmerRouter);
apiRouter.use("/farmers", opportunityMatchingRouter);
apiRouter.use("/farmers", saleIntentRouter);
apiRouter.use("/farmers", recommendationRouter);
apiRouter.use("/farmers", dashboardRouter);
apiRouter.use("/farmers", priceAlertRouter);
apiRouter.get("/crops/:cropId/prices", listCropPrices);
apiRouter.use("/crops", priceIntelligenceRouter);
apiRouter.use("/markets", marketRouter);
apiRouter.use("/prices", priceRouter);
apiRouter.use("/price-discovery", priceDiscoveryRouter);
apiRouter.use("/buyers", buyerRouter);

export default apiRouter;
