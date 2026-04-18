import httpClient from "./httpClient.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import { AppError } from "./errors.utils.js";

export const getPatientProfilesByUserIds = async (userIds = []) => {
  if (!userIds.length) {
    return [];
  }

  const patientServiceUrl = process.env.PATIENT_SERVICE_URL;
  if (!patientServiceUrl) {
    throw new AppError(
      "PATIENT_SERVICE_URL is not configured in appointment service.",
      500,
    );
  }

  const query = encodeURIComponent(userIds.join(","));
  const response = await httpClient.get(
    patientServiceUrl,
    `/api/patients/internal/profiles?userIds=${query}`,
    serviceNames.APPOINTMENT_SERVICE,
  );

  return response.data || [];
};
