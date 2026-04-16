import axios from "axios";
import { ValidationError, NotFoundError } from "./errors.utils.js";

const patientServiceClient = axios.create({
  baseURL: process.env.PATIENT_SERVICE_URL,
  timeout: 7000,
});

const buildGatewayHeaders = (user) => {
  if (!process.env.GATEWAY_SECRET) {
    throw new ValidationError("GATEWAY_SECRET is not configured");
  }

  if (!user || !user.userId || !user.email || !user.role) {
    throw new ValidationError("Logged-in user information is missing");
  }

  return {
    "x-user-id": user.userId,
    "x-user-email": user.email,
    "x-user-role": user.role,
    "x-gateway-secret": process.env.GATEWAY_SECRET,
  };
};

export const getPatientProfileById = async (patientId, user) => {
  if (!patientId) {
    throw new ValidationError("patientId is required");
  }

  try {
    const response = await patientServiceClient.get(
      `/api/patients/profile/${patientId}`,
      {
        headers: buildGatewayHeaders(user),
      },
    );

    return response.data?.data || null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new NotFoundError("Patient profile");
    }
    throw error;
  }
};
