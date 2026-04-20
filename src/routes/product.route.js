import express from "express";
import {
  createProductController,
  deleteProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
} from "../controllers/product.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/:id", getProductByIdController);

router.post(
  "/",
  authRequired,
  authorization("admin", "owner"),
  createProductController,
);
router.patch(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  updateProductController,
);
router.delete(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  deleteProductController,
);

export default router;
