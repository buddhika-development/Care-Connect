import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import sessionRoutes from "./routes/session.routes.js";
import roomRoutes from "./routes/room.routes.js";
import internalRoutes from "./routes/internal.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "telemedicine-service",
    message: "Service is running",
  });
});

// Routes
app.use("/api/telemedicine/sessions", sessionRoutes);
app.use("/api/telemedicine/room", roomRoutes);
app.use("/api/internal", internalRoutes);

// Error handler — must be last
app.use(errorHandler);

export default app;