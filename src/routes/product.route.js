import express from "express";
import {
  createProductController,
  deleteProductController,
  getAllProductsController,
  getAllProductsAdminController,
  getProductByIdController,
  updateProductController,
} from "../controllers/product.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/:id", getProductByIdController);

router.get(
  "/admin/all",
  authRequired,
  authorization("admin", "owner"),
  getAllProductsAdminController,
);

router.post(
  "/",
  authRequired,
  authorization("admin", "owner"),
  uploadProductImage.single("image"),
  createProductController,
);
router.patch(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  uploadProductImage.single("image"),
  updateProductController,
);
router.delete(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  deleteProductController,
);

export default router;
