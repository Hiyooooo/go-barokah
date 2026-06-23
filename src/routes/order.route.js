import express from "express";
import {
  cancelMyOrderController,
  createOrderController,
  createPickupOrderController,
  getMyOrderByIdController,
  getMyOrdersController,
} from "../controllers/order.controller.js";
import { initiatePaymentController } from "../controllers/payment.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin"));

router.post("/", createOrderController);
router.post("/pickup", createPickupOrderController);
router.get("/", getMyOrdersController);
router.get("/:id", getMyOrderByIdController);
router.patch("/:id/cancel", cancelMyOrderController);
router.post("/:id/pay", initiatePaymentController);

export default router;
