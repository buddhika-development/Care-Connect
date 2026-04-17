import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  createDoctorAvailabilityController,
  getMyDoctorAvailabilitiesController,
  updateDoctorAvailabilityController,
  cancelDoctorAvailabilityController,
  markDoctorAvailabilityAsOngoingController,
  markDoctorAvailabilityAsCompletedController,
  getAvailabilitySlotDetailsByIdController,
} from "../controllers/doctorAvailability.controller.js";

const router = express.Router();

router.post("/", extractUser, createDoctorAvailabilityController);
router.get("/", extractUser, getMyDoctorAvailabilitiesController);
router.put("/:availabilityId", extractUser, updateDoctorAvailabilityController);
router.patch(
  "/:availabilityId/ongoing",
  extractUser,
  markDoctorAvailabilityAsOngoingController,
);
router.patch(
  "/:availabilityId/completed",
  extractUser,
  markDoctorAvailabilityAsCompletedController,
);
router.delete("/:availabilityId", extractUser, cancelDoctorAvailabilityController);
router.get("/slots/:slotId", extractUser, getAvailabilitySlotDetailsByIdController);

export default router;
