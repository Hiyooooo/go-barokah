import express from "express";
import { googleLoginController, loginController, logoutController, registerController } from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/google", googleLoginController);
router.post("/logout", authRequired, logoutController);

export default router;
