import express from "express";
import { updateAccountController } from "../controllers/user.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin"));

router.patch("/", updateAccountController);

export default router;
