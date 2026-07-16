import express from "express";
import { googleLoginController, loginController, registerController } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/google", googleLoginController);

export default router;
