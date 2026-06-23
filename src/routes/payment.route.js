import express from "express";
import { midtransNotificationController } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/midtrans/notification", midtransNotificationController);

export default router;
