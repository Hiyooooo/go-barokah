import express from "express";
import {
  createCashSaleController,
  getCashSaleController,
  getCashSaleReceiptController,
} from "../controllers/cash-sale.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authRequired, authorization("cashier"));
router.post("/", createCashSaleController);
router.get("/:saleNumber", getCashSaleController);
router.get("/:saleNumber/receipt", getCashSaleReceiptController);
export default router;
