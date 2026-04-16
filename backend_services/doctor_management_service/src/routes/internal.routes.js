import { Router } from "express";
import { internalMiddleware } from "../middleware/internal.middleware.js";
import { updateAvailabilitySlotBookStatusController } from "../controllers/doctorAvailability.controller.js";

const internalRoutes = Router();

internalRoutes.patch(
  "/slots/:slotId/book-status",
  internalMiddleware,
  updateAvailabilitySlotBookStatusController,
);

export default internalRoutes;