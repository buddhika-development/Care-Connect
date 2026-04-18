import { Router } from "express";
import AppointmentController from "../controllers/appointment.controller.js";
import AppointmentStatusController from "../controllers/appointmentStatus.controller.js";
import extractUser from "../middleware/extractUser.middleware.js";
import authorize from "../middleware/authorize.middleware.js";

const router = Router();

// Patient routes
router.post(
  "/",
  extractUser,
  authorize("patient", "doctor"),
  AppointmentController.createAppointment,
);

router.get(
  "/",
  extractUser,
  authorize("patient", "doctor"),
  AppointmentController.getAppointments,
);

router.get(
  "/doctor/day/:date",
  extractUser,
  authorize("doctor"),
  AppointmentController.getDoctorAppointmentsByDate,
);

router.get(
  "/admin/all",
  extractUser,
  authorize("admin"),
  AppointmentController.getAllAppointmentsForAdmin,
);

router.get(
  "/:appointmentId",
  extractUser,
  authorize("patient", "doctor"),
  AppointmentController.getAppointmentById,
);

router.patch(
  "/:appointmentId/cancel",
  extractUser,
  authorize("patient", "doctor"),
  AppointmentStatusController.cancelAppointment,
);

router.patch(
  "/:appointmentId/reschedule",
  extractUser,
  authorize("patient"),
  AppointmentStatusController.rescheduleAppointment,
);

// Doctor routes
router.patch(
  "/:appointmentId/start",
  extractUser,
  authorize("doctor"),
  AppointmentStatusController.startAppointment,
);

router.patch(
  "/:appointmentId/complete",
  extractUser,
  authorize("doctor"),
  AppointmentStatusController.completeAppointment,
);

export default router;
