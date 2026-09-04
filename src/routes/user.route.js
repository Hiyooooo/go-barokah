import express from "express";
import {
  getMyProfileController,
  updateAccountController,
} from "../controllers/user.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin", "owner", "cashier"));

router.get("/me", getMyProfileController);
router.patch("/", updateAccountController);

export default router;
