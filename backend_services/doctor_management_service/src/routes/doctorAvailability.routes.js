import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  createDoctorAvailabilityController,
  getMyDoctorAvailabilitiesController,
  updateDoctorAvailabilityController,
  cancelDoctorAvailabilityController,
  updateAvailabilitySlotBookStatusController,
  getAvailabilitySlotByIdController,
} from "../controllers/doctorAvailability.controller.js";

const router = express.Router();

// ── Internal-only: get slot details by slotId (no user JWT — internal secret) ─
// Called by appointment service to fetch slot_date, times, fee, channelling_mode
router.get("/slots/:slotId", getAvailabilitySlotByIdController);

router.post("/", extractUser, createDoctorAvailabilityController);
router.get("/", extractUser, getMyDoctorAvailabilitiesController);
router.put("/:availabilityId", extractUser, updateDoctorAvailabilityController);
router.delete("/:availabilityId", extractUser, cancelDoctorAvailabilityController);
router.patch("/slots/:slotId/book-status", extractUser, updateAvailabilitySlotBookStatusController);

export default router;