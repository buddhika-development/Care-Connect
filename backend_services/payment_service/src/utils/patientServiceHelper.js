import axios from "axios";
import { AppError } from "./errors.utils.js";

const INTERNAL_CALLER_SERVICE = "care-connect-payment-service";

export async function getPatientProfilesByUserIds(userIds = []) {
  if (!userIds.length) {
    return [];
  }

  const patientServiceUrl = process.env.PATIENT_SERVICE_URL;
  if (!patientServiceUrl) {
    throw new AppError("PATIENT_SERVICE_URL is not configured", 500);
  }

  const response = await axios.get(
    `${patientServiceUrl}/api/patients/internal/profiles`,
    {
      params: {
        userIds: userIds.join(","),
      },
      headers: {
        "x-internal-secret": process.env.INTERNAL_SECRET,
        "x-service-name": INTERNAL_CALLER_SERVICE,
      },
      timeout: 5000,
    },
  );

  return response.data?.data || [];
}

export async function getPatientProfileByUserId(userId) {
  if (!userId) {
    return null;
  }

  const profiles = await getPatientProfilesByUserIds([userId]);
  return profiles?.[0] || null;
}
