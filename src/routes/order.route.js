import express from "express";
import {
  cancelMyOrderController,
  createOrderController,
  getMyOrderByIdController,
  getMyOrdersController,
} from "../controllers/order.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin"));

router.post("/", createOrderController);
router.get("/", getMyOrdersController);
router.get("/:id", getMyOrderByIdController);
router.patch("/:id/cancel", cancelMyOrderController);

export default router;
