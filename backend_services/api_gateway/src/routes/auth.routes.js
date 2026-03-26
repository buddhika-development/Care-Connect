import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { loginController } from "../controllers/login.controllers.js";
import { registerController } from "../controllers/register.controllers.js";

const authRoutes = Router();

authRoutes.post("/login", authLimiter, loginController);

authRoutes.post("/register", authLimiter, registerController);

export default authRoutes;
