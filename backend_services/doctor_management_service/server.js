import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import doctorProfileRoutes from "./src/routes/doctorProfile.routes.js";
import doctorAvailabilityRoutes from "./src/routes/doctorAvailability.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Public route - just to check service is alive
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "doctor-management-service",
    message: "Service is running",
  });
});

// Doctor profile routes
app.use("/api/doctors/profile", doctorProfileRoutes);
app.use("/api/doctors/availability", doctorAvailabilityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`Doctor management service running on port ${PORT}`);
});