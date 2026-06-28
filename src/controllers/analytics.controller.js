import {
  getCostAnalysisService,
  getCashFlowService,
  getNetProfitService,
  getOmzetService,
} from "../services/analytics.service.js";

export async function getOmzetController(req, res, next) {
  try {
    const data = await getOmzetService(req.query);
    res.json({
      message: "Omzet data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNetProfitController(req, res, next) {
  try {
    const data = await getNetProfitService(req.query);
    res.json({
      message: "Net profit data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCashFlowController(req, res, next) {
  try {
    const data = await getCashFlowService(req.query);
    res.json({
      message: "Cash flow data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCostAnalysisController(req, res, next) {
  try {
    const data = await getCostAnalysisService(req.query);
    res.json({
      message: "Cost analysis data retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
