import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "notification-service",
    message: "Service is running",
  });
});

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

export default app;
