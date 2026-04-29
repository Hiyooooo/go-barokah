import express from "express";
import { authorization, authRequired } from "../middlewares/auth.middleware.js";
import {
  createCategoryController,
  deleteCategoryController,
  getAllCategoryController,
  getCategoryByIdController,
  updateCategoryController,
} from "../controllers/category.controller.js";

const router = express.Router();

router.get(
  "/",
  authRequired,
  authorization("admin", "owner"),
  getAllCategoryController,
);

router.get(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  getCategoryByIdController,
);

router.post(
  "/",
  authRequired,
  authorization("admin", "owner"),
  createCategoryController,
);

router.patch(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  updateCategoryController,
);

router.delete(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  deleteCategoryController,
);

export default router;
