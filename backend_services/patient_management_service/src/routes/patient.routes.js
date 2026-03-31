import { Router } from "express";
import extractUser from "../middleware/extractUser.middleware.js";
import { upload } from "../config/multer.js";
import { CreatePatientProfileController } from "../controllers/createPatientProfile.controller.js";

const patientRoutes = Router();

patientRoutes.post(
  "/profile",
  extractUser,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "medicalDocuments", maxCount: 5 },
  ]),
  CreatePatientProfileController,
);

export default patientRoutes;
