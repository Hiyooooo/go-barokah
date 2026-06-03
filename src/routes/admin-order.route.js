import express from "express";
import {
  getAllOrdersController,
  getOrderByIdForAdminController,
  updateOrderStatusController,
  updatePaymentStatusController,
} from "../controllers/order.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("admin", "owner"));

router.get("/", getAllOrdersController);
router.get("/:id", getOrderByIdForAdminController);
router.patch("/:id/status", updateOrderStatusController);
router.patch("/:id/payment-status", updatePaymentStatusController);

export default router;
