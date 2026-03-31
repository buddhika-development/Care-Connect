import { getPatientProfileByUserId } from "../repositories/patientProfile.repository.js";
import {
  DatabaseError,
  ForbiddenError,
  ValidationError,
} from "../utils/errors.utils.js";

export async function GetPatientProfileUsecase(userId, headersUserId, role) {
  try {
    if (!userId || !headersUserId || !role) {
      throw new ValidationError("Some details are Missing! Please try again.");
    }

    const { patient, patientError } = await getPatientProfileByUserId(userId);

    if (patientError) {
      console.error(
        "Database error in GetPatientProfileUsecase:",
        patientError,
      );
      throw new DatabaseError(
        "Failed to retrieve patient profile. Please try again later.",
      );
    }

    if (role === "patient" && userId !== headersUserId) {
      throw new ForbiddenError(
        "You are not authorized to access this patient's profile.",
      );
    }

    if (!patient) {
      return {
        success: true,
        message: "Patient profile not found. Please complete your profile.",
      };
    }

    return {
      success: true,
      message: "Patient profile retrieved successfully.",
      data: patient,
    };
  } catch (error) {
    console.error("Error in GetPatientProfileUsecase:", error);
    throw error;
  }
}
