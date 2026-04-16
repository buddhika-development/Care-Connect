import { Router } from "express";
import InternalController from "../controllers/internal.controller.js";
import { internalMiddleware } from "../middleware/internal.middleware.js";

const router = Router();

router.get(
  "/appointments/:appointmentId",
  internalMiddleware,
  InternalController.getAppointmentById
);

router.get(
  "/appointments/doctor/:doctorId/date/:date",
  internalMiddleware,
  InternalController.getAppointmentsByDoctorAndDate
);

router.get(
  "/appointments/patient/:patientId",
  internalMiddleware,
  InternalController.getAppointmentsByPatient
);

router.get(
  "/appointments/slot/:slotId",
  internalMiddleware,
  InternalController.getAppointmentBySlotId
);

router.patch(
  "/appointments/:appointmentId/payment",
  internalMiddleware,
  InternalController.handlePaymentUpdate
);

export default router;