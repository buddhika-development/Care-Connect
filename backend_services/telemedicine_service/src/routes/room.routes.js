import { Router } from "express";
import RoomController from "../controllers/room.controller.js";
import extractUser from "../middleware/extractUser.middleware.js";
import authorize from "../middleware/authorize.middleware.js";

const router = Router();

router.get(
  "/join/:sessionId",
  extractUser,
  authorize("patient", "doctor"),
  RoomController.joinRoom
);

router.patch(
  "/start/:sessionId",
  extractUser,
  authorize("doctor"),
  RoomController.startRoom
);

export default router;