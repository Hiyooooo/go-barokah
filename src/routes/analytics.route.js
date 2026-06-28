import express from "express";
import {
  getCostAnalysisController,
  getCashFlowController,
  getNetProfitController,
  getOmzetController,
} from "../controllers/analytics.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("owner"));

router.get("/omzet", getOmzetController);

router.get("/net-profit", getNetProfitController);

router.get("/cash-flow", getCashFlowController);

router.get("/cost-analysis", getCostAnalysisController);

export default router;
