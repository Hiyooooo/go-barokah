import express from "express";
import {
  requestEmailOtpController,
  verifyEmailOtpController,
} from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/request", requestEmailOtpController);
router.post("/verify", verifyEmailOtpController);

export default router;
