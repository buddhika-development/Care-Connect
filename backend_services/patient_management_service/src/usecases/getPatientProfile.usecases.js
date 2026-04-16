import { getPatientProfileByUserId } from "../repositories/patientProfile.repository.js";
import { getSignedDocumentUrls } from "../repositories/storage.repository.js";
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
    const medicalReportUrls = await getSignedDocumentUrls(
      patient.medical_report_urls,
    );

    return {
      success: true,
      message: "Patient profile retrieved successfully.",
      data: {
        id: patient.id,
        user_id: patient.user_id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        contact_no: patient.contact_no,
        address: patient.address,
        birthday: patient.birthday,
        age: patient.age,
        gender: patient.gender,
        blood_type: patient.blood_type,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_no: patient.emergency_contact_no,
        allergies: patient.allergies,
        chronic_conditions: patient.chronic_conditions,
        current_medications: patient.current_medications,
        profile_img_url: patient.profile_img_url,
        medical_report_urls: medicalReportUrls,
      },
    };
  } catch (error) {
    console.error("Error in GetPatientProfileUsecase:", error);
    throw error;
  }
}
