import { Router } from "express";
import SessionController from "../controllers/session.controller.js";
import extractUser from "../middleware/extractUser.middleware.js";
import authorize from "../middleware/authorize.middleware.js";

const router = Router();

router.get(
  "/",
  extractUser,
  authorize("patient", "doctor"),
  SessionController.getSessions
);

router.get(
  "/:sessionId",
  extractUser,
  authorize("patient", "doctor"),
  SessionController.getSessionById
);

router.patch(
  "/:sessionId/cancel",
  extractUser,
  authorize("patient", "doctor"),
  SessionController.cancelSession
);

router.patch(
  "/:sessionId/complete",
  extractUser,
  authorize("doctor"),
  SessionController.completeSession
);

export default router;