import express from "express";
import {
  requestEmailOtpController,
  requestPhoneNumberOtpController,
  verifyEmailOtpController,
  verifyPhoneNumberOtpController,
} from "../controllers/otp.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/email/request", requestEmailOtpController);
router.post("/email/verify", verifyEmailOtpController);
router.post("/phone/request", authRequired, requestPhoneNumberOtpController);
router.post("/phone/verify", authRequired, verifyPhoneNumberOtpController);

export default router;
