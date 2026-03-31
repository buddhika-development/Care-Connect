import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { loginController } from "../controllers/login.controllers.js";
import { registerController } from "../controllers/register.controllers.js";
import { RefreshTokenController } from "../controllers/refresh.controllers.js";
import { logoutController } from "../controllers/logout.controllers.js";

const authRoutes = Router();

authRoutes.post("/login", authLimiter, loginController);

authRoutes.post("/register", authLimiter, registerController);

authRoutes.post("/logout", authLimiter, logoutController);

authRoutes.get("/refresh-token", RefreshTokenController);

export default authRoutes;
