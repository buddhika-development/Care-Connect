import express from "express";
import { InitiatePaymentController } from "../controllers/initiatePayment.controller.js";
import { WebhookHandlerController } from "../controllers/webhookHandler.controller.js";
import { GetPaymentStatusController } from "../controllers/getPaymentStatus.controller.js";
import {
  GetAdminPaymentsController,
  GetAdminPaymentSummaryController,
} from "../controllers/adminPayments.controller.js";
import extractUser from "../middleware/extractUser.middleware.js";

const router = express.Router();

// Patient initiates payment after booking appointment
// extractUser runs first to verify JWT via gateway headers
router.post("/initiate", extractUser, InitiatePaymentController);

// PayHere calls this directly after payment is processed
// NO extractUser here — PayHere doesn't send your JWT
// Security is handled by the md5sig signature verification inside the usecase
router.post("/webhook", WebhookHandlerController);

// Check payment status — patient, doctor or admin can call this
router.get("/status/:appointmentId", extractUser, GetPaymentStatusController);

// Admin payment management
router.get("/admin/all", extractUser, GetAdminPaymentsController);
router.get("/admin/summary", extractUser, GetAdminPaymentSummaryController);

export default router;
