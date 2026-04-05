import express from "express";
import { authRequired } from "../middlewares/auth.midleware.js";
import { requestEmailOtpController, verifyEmailOtpController } from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/email/otp/request", authRequired, requestEmailOtpController);
router.post("/email/otp/verify", authRequired, verifyEmailOtpController);

export default router;
