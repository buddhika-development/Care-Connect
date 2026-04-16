import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  createMyDoctorProfileController,
  getAllDoctorsWithAvailabilityController,
  getMyDoctorProfileController,
  updateMyDoctorProfileController,
  updateDoctorEmbeddingController,
} from "../controllers/doctorProfile.controller.js";

const router = express.Router();

// Get all doctors with nested availability and slots from the view
router.get("/all", getAllDoctorsWithAvailabilityController);

// Create doctor profile by logged-in doctor
router.post("/", extractUser, createMyDoctorProfileController);

// View my doctor profile by logged-in doctor
router.get("/", extractUser, getMyDoctorProfileController);

// Update my doctor profile by logged-in doctor
router.put("/", extractUser, updateMyDoctorProfileController);

// Update doctor embedding (internal service-to-service call - no auth middleware)
router.patch("/:doctorId/embedding", updateDoctorEmbeddingController);

export default router;
