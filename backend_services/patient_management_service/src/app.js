import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import patientRoutes from "./routes/patient.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(json());

console.log(
  "Patient Management Service - App initialized with middleware and routes.",
);
app.use("/api/patients", patientRoutes);

app.use(errorHandler);

export default app;
