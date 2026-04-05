import { requestEmailOtp, verifyEmailOtp } from "../services/otp.service.js";

export async function requestEmailOtpController(req, res, next) {
  try {
    const userId = req.user.id;

    await requestEmailOtp(userId);

    return res.status(200).json({
      message: "Email OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailOtpController(req, res, next) {
  try {
    const userId = req.user.id;

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }
    await verifyEmailOtp(userId, otp);

    return res.status(200).json({
      message: "Verify OTP successfully",
    });
  } catch (error) {
    next(error);
  }
}
