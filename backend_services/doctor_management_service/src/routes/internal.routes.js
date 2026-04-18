import { Router } from "express";
import { internalMiddleware } from "../middleware/internal.middleware.js";
import {
  updateAvailabilitySlotBookStatusController,
  getAvailabilitySlotDetailsByIdController,
} from "../controllers/doctorAvailability.controller.js";

const internalRoutes = Router();

internalRoutes.patch(
  "/slots/:slotId/book-status",
  internalMiddleware,
  updateAvailabilitySlotBookStatusController,
);

internalRoutes.get(
  "/internal/slots/:slotId",
  internalMiddleware,
  getAvailabilitySlotDetailsByIdController,
);

export default internalRoutes;
