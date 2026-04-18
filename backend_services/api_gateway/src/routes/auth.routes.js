import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { loginController } from "../controllers/login.controllers.js";
import { registerController } from "../controllers/register.controllers.js";
import { RefreshTokenController } from "../controllers/refresh.controllers.js";
import { logoutController } from "../controllers/logout.controllers.js";
import { ActivateUserController } from "../controllers/activateUser.controller.js";
import { changePasswordController } from "../controllers/changePassword.controller.js";
import {
  getAdminUsersController,
  updateDoctorVerificationStatusController,
  updateUserActiveStatusController,
} from "../controllers/adminUsers.controllers.js";
import {
  authenticate,
  authenticateIfPresent,
  authorize,
} from "../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/login", authLimiter, loginController);
//authRoutes.post("/login", loginController);

authRoutes.post(
  "/register",
  authLimiter,
  authenticateIfPresent,
  registerController,
);

authRoutes.post("/logout", authLimiter, logoutController);

authRoutes.patch(
  "/profile/status/:userId",
  authLimiter,
  authenticate,
  authorize("admin"),
  ActivateUserController,
);

authRoutes.get(
  "/admin/users",
  authenticate,
  authorize("admin"),
  getAdminUsersController,
);

authRoutes.patch(
  "/admin/users/:userId/active",
  authenticate,
  authorize("admin"),
  updateUserActiveStatusController,
);

authRoutes.patch(
  "/admin/users/:userId/verified",
  authenticate,
  authorize("admin"),
  updateDoctorVerificationStatusController,
);

authRoutes.get("/refresh-token", RefreshTokenController);

authRoutes.patch(
  "/change-password",
  authenticate,
  authorize("patient", "doctor"),
  changePasswordController,
);

export default authRoutes;
