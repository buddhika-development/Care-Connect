import express from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import {
  createMyDoctorProfileController,
  getMyDoctorProfileController,
  updateMyDoctorProfileController,
} from "../controllers/doctorProfile.controller.js";

const router = express.Router();

// Create doctor profile by logged-in doctor
router.post("/", extractUser, createMyDoctorProfileController);

// View my doctor profile by logged-in doctor
router.get("/", extractUser, getMyDoctorProfileController);

// Update my doctor profile by logged-in doctor
router.put("/", extractUser, updateMyDoctorProfileController);

export default router;