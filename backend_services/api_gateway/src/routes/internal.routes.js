import { Router } from "express";
import { CompleteProfileController } from "../controllers/completeProfile.controllers.js";
import { internalMiddleware } from "../middleware/internal.middleware.js";

const internalRoutes = Router();

internalRoutes.patch(
  "/:userId/profile-complete",
  internalMiddleware,
  CompleteProfileController,
);

export default internalRoutes;
