import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import extractUser from "./src/middleware/extractUser.middleware.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(json());

const PORT = process.env.PORT || 3001;

// Public route - just to check service is alive
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "doctor-management-service",
    message: "Service is running",
  });
});

// Protected test route - must come through gateway
app.get("/api/doctors/profile", extractUser, (req, res) => {
  res.json({
    success: true,
    message: "Gateway header auth working correctly",
    userFromGateway: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Doctor management service running on port ${PORT}`);
});
