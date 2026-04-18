import { Router } from "express";
import { internalMiddleware } from "../middleware/internal.middleware.js";
import { GetPatientProfilesInternalController } from "../controllers/internal.controller.js";

const internalRoutes = Router();

internalRoutes.get(
  "/profiles",
  internalMiddleware,
  GetPatientProfilesInternalController,
);

export default internalRoutes;
