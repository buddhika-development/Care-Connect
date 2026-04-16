import { Router } from "express";
import NotificationController from "../controllers/notification.controller.js";
import extractUser from "../middleware/extractUser.middleware.js";

const router = Router();

/**
 * POST /api/notifications/send
 * Body: { email?, phone?, title, content }
 * At least one of email or phone is required.
 * Accessible both directly and through the API Gateway.
 */
router.post("/send", NotificationController.send);

export default router;
