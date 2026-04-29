import {
  requestEmailOtpByEmail,
  verifyEmailOtpByEmail,
} from "../services/otp.service.js";

export async function requestEmailOtpController(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await requestEmailOtpByEmail(email);

    return res.status(200).json({
      message: "Email OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailOtpController(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }
    await verifyEmailOtpByEmail(email, otp);

    return res.status(200).json({
      message: "Verify OTP successfully",
    });
  } catch (error) {
    next(error);
  }
}
