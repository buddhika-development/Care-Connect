import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  cancelPrescriptionController,
  createPrescriptionController,
  getMyPatientPrescriptionsController,
  getMyPrescriptionsController,
  getPrescriptionsByAppointmentController,
} from "../controllers/prescription.controller.js";

const router = express.Router();

router.get("/patient/my", extractUser, getMyPatientPrescriptionsController);
router.post(
  "/appointment/:appointmentId",
  extractUser,
  createPrescriptionController,
);
router.get("/", extractUser, getMyPrescriptionsController);
router.get(
  "/appointment/:appointmentId",
  extractUser,
  getPrescriptionsByAppointmentController,
);
router.patch(
  "/:prescriptionId/cancel",
  extractUser,
  cancelPrescriptionController,
);

export default router;