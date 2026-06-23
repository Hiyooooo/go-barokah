import {
  initiatePaymentService,
  handleMidtransNotificationService,
} from "../services/payment.service.js";

export async function initiatePaymentController(req, res, next) {
  try {
    const result = await initiatePaymentService(req.user.id, req.params.id);
    return res.status(200).json({
      message: "Berhasil mendapatkan token pembayaran",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function midtransNotificationController(req, res, next) {
  try {
    await handleMidtransNotificationService(req.body);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    next(error);
  }
}
