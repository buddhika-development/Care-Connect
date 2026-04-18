import express from "express";
import { internalMiddleware } from "../middleware/internal.middleware.js";
import { RefundPaymentInternalController } from "../controllers/internalPayment.controller.js";

const router = express.Router();

router.post(
  "/payments/:paymentId/refund",
  internalMiddleware,
  RefundPaymentInternalController,
);

export default router;
