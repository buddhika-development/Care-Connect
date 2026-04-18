import { getPatientProfilesByUserIds } from "../repositories/patientProfile.repository.js";
import { ValidationError } from "../utils/errors.utils.js";

export async function GetPatientProfilesInternalUsecase(userIdsParam) {
  const userIds = String(userIdsParam || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (userIds.length === 0) {
    throw new ValidationError("userIds query parameter is required");
  }

  const { data, error } = await getPatientProfilesByUserIds(userIds);

  if (error) {
    throw error;
  }

  return {
    success: true,
    message: "Patient profiles fetched successfully",
    data: data || [],
  };
}
