import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import { getPatientMedicalRecordsByAppointmentController } from "../controllers/patientMedicalRecords.controller.js";

const router = express.Router();

router.get(
  "/appointments/:appointmentId/medical-records",
  extractUser,
  getPatientMedicalRecordsByAppointmentController,
);

export default router;
