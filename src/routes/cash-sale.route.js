import express from "express";
import {
  createCashSaleController,
  getCashSaleController,
  getCashSalesController,
  getCashSaleReceiptController,
  cancelCashSaleController,
} from "../controllers/cash-sale.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authRequired);
router.post("/", authorization("cashier"), createCashSaleController);
router.get(
  "/",
  authorization("cashier", "admin", "owner"),
  getCashSalesController,
);
router.get(
  "/:saleNumber",
  authorization("cashier", "admin", "owner"),
  getCashSaleController,
);
router.post(
  "/:saleNumber/cancel",
  authorization("cashier"),
  cancelCashSaleController,
);
router.get(
  "/:saleNumber/receipt",
  authorization("cashier"),
  getCashSaleReceiptController,
);
export default router;
