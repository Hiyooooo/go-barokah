import express from "express";
import {
  clearCartController,
  createCartItemController,
  deleteCartItemController,
  getCartController,
  updateCartItemController,
} from "../controllers/cart.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin"));

router.get("/", getCartController);
router.post("/items", createCartItemController);
router.patch("/items/:productId", updateCartItemController);
router.delete("/items/:productId", deleteCartItemController);
router.delete("/", clearCartController);

export default router;
