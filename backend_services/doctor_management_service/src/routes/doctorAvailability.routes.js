import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  createDoctorAvailabilityController,
  getMyDoctorAvailabilitiesController,
  updateDoctorAvailabilityController,
  cancelDoctorAvailabilityController,
  updateAvailabilitySlotBookStatusController,
} from "../controllers/doctorAvailability.controller.js";

const router = express.Router();

router.post("/", extractUser, createDoctorAvailabilityController);
router.get("/", extractUser, getMyDoctorAvailabilitiesController);
router.put("/:availabilityId", extractUser, updateDoctorAvailabilityController);
router.delete("/:availabilityId", extractUser, cancelDoctorAvailabilityController);
router.patch("/slots/:slotId/book-status", extractUser, updateAvailabilitySlotBookStatusController);

export default router;