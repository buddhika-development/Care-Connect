import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import paymentRoutes from "./src/routes/payment.routes.js";
import internalRoutes from "./src/routes/internal.routes.js";
import { errorHandler } from "./src/middleware/errorHandler.middleware.js";

dotenv.config();
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(json());

const PORT = process.env.PORT || 3001;

// Public route - just to check service is alive
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "payment-service",
    message: "Service is running",
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary test route — remove after testing
app.get("/test-payment", (req, res) => {
  res.sendFile(path.join(__dirname, "test-payment.html"));
});

app.use("/api/payments/webhook", express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/internal", internalRoutes);

// Global error handler — catches anything thrown in controllers
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
