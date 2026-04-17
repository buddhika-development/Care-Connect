import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { loginController } from "../controllers/login.controllers.js";
import { registerController } from "../controllers/register.controllers.js";
import { RefreshTokenController } from "../controllers/refresh.controllers.js";
import { logoutController } from "../controllers/logout.controllers.js";
import { ActivateUserController } from "../controllers/activateUser.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/login", authLimiter, loginController);
//authRoutes.post("/login", loginController);

authRoutes.post("/register", authLimiter, registerController);

authRoutes.post("/logout", authLimiter, logoutController);

authRoutes.patch(
  "/profile/status/:userId",
  authLimiter,
  authenticate,
  authorize("admin"),
  ActivateUserController,
);

authRoutes.get("/refresh-token", RefreshTokenController);

export default authRoutes;
