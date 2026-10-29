import { Router } from "express";
import { findFarmerOpportunities } from "../controllers/opportunity-matching.controller";

const opportunityMatchingRouter = Router();

opportunityMatchingRouter.get("/:farmerId/opportunities", findFarmerOpportunities);

export default opportunityMatchingRouter;