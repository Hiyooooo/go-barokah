import express from "express";
import { authorization, authRequired } from "../middlewares/auth.middleware.js";
import {
  createTypeController,
  deleteTypeController,
  getAllTypeController,
  getTypeByIdController,
  updateTypeController,
} from "../controllers/type.controller.js";

const router = express.Router();

router.get(
  "/",
  authRequired,
  authorization("admin", "owner"),
  getAllTypeController,
);

router.get(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  getTypeByIdController,
);

router.post(
  "/",
  authRequired,
  authorization("admin", "owner"),
  createTypeController,
);

router.patch(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  updateTypeController,
);

router.delete(
  "/:id",
  authRequired,
  authorization("admin", "owner"),
  deleteTypeController,
);

export default router;
