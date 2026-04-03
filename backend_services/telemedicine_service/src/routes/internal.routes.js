import { Router } from "express";
import InternalController from "../controllers/internal.controller.js";
import {internalMiddleware} from "../middleware/internal.middleware.js";

const router = Router();

router.post(
  "/telemedicine/sessions",
  internalMiddleware,
  InternalController.createSession
);

router.get(
  "/telemedicine/sessions/appointment/:appointmentId",
  internalMiddleware,
  InternalController.getSessionByAppointmentId
);

router.patch(
  "/telemedicine/sessions/:sessionId/status",
  internalMiddleware,
  InternalController.syncSessionStatus
);

export default router;