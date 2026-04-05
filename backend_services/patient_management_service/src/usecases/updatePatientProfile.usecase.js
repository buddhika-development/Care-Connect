import {
  getPatientProfileByUserId,
  updatePatientProfile,
} from "../repositories/patientProfile.repository.js";
import {
  deleteMedicalDocuments,
  deleteProfileImage,
  uploadMedicalDocument,
  uploadProfileImage,
} from "../repositories/storage.repository.js";
import {
  AppError,
  InvalidEmailError,
  InvalidInputError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";

export async function UpdatePatientProfileUsecase(
  userId,
  headerEmail,
  patientData,
  files,
) {
  try {
    const {
      email,
      firstName,
      lastName,
      contactNumber,
      address,
      dateOfBirth,
      gender,
      age,
      bloodType,
      emergencyContactName,
      emergencyContactNumber,
      allergies,
      chronicConditions,
      currentMedications,
      removedDocumentPaths,
    } = patientData;

    if (
      !userId ||
      !email ||
      !firstName ||
      !lastName ||
      !contactNumber ||
      !address ||
      !dateOfBirth ||
      !gender ||
      !age
    ) {
      throw new ValidationError("Missing required patient profile fields");
    }

    const { patient, patientError } = await getPatientProfileByUserId(userId);

    if (patientError || !patient) {
      throw new NotFoundError("Patient profile");
    }

    if (email !== headerEmail) {
      throw new InvalidEmailError(
        "Email in profile data does not match current user email",
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidEmailError("Invalid email format");
    }

    const phoneDigits = contactNumber.replace(/\D/g, "");
    console.log("Extracted phone digits:", phoneDigits.length);
    if (phoneDigits.length < 10 || phoneDigits.length > 10) {
      throw new InvalidInputError("Contact number must have exactly 10 digits");
    }

    if (address.trim().length < 15) {
      throw new InvalidInputError(
        "Address must be at least 15 characters long",
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      throw new InvalidInputError("Date of birth must be in YYYY-MM-DD format");
    }

    const parsedDOB = new Date(dateOfBirth);
    if (isNaN(parsedDOB.getTime())) {
      throw new InvalidInputError("Date of birth is not a valid date");
    }

    // Date of birth can't be in the future
    if (parsedDOB > new Date()) {
      throw new InvalidInputError("Date of birth cannot be a future date");
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      throw new InvalidInputError(
        "Age must be a valid number between 0 and 120",
      );
    }

    const today = new Date();

    let calculatedAge = today.getFullYear() - parsedDOB.getFullYear();

    const hasBirthdayPassedThisYear =
      today.getMonth() > parsedDOB.getMonth() ||
      (today.getMonth() === parsedDOB.getMonth() &&
        today.getDate() >= parsedDOB.getDate());

    if (!hasBirthdayPassedThisYear) {
      calculatedAge -= 1;
    }

    if (Math.abs(calculatedAge - parsedAge) > 1) {
      throw new InvalidInputError("Age does not match with date of birth");
    }

    let profileImageUrl = patient.profile_img_url;

    if (files?.profileImage?.[0]) {
      if (patient.profile_img_url) {
        await deleteProfileImage(patient.profile_img_url);
      }

      profileImageUrl = await uploadProfileImage(userId, files.profileImage[0]);
    }

    let currentDocumentPaths = patient.medical_report_urls || [];

    if (removedDocumentPaths) {
      let pathsToRemove = [];

      try {
        pathsToRemove = JSON.parse(removedDocumentPaths);
      } catch (err) {
        throw new InvalidInputError(
          "Invalid format for removed document paths",
        );
      }

      if (!Array.isArray(pathsToRemove)) {
        throw new InvalidInputError(
          "Removed document paths should be an array of strings",
        );
      }

      const unauthorizedPaths = pathsToRemove.filter(
        (path) => !path.startsWith(`${userId}/`),
      );

      if (unauthorizedPaths.length > 0) {
        throw new InvalidInputError(
          "One or more document paths are invalid or do not belong to the user",
        );
      }

      await deleteMedicalDocuments(pathsToRemove);

      currentDocumentPaths = currentDocumentPaths.filter(
        (path) => !pathsToRemove.includes(path),
      );
    }

    if (files?.medicalDocuments?.length > 0) {
      if (currentDocumentPaths.length + files.medicalDocuments.length > 10) {
        throw new InvalidInputError(
          "Total number of medical documents cannot exceed 10",
        );
      }

      const uploadPromises = files.medicalDocuments.map((file) =>
        uploadMedicalDocument(userId, file),
      );

      const newPaths = await Promise.all(uploadPromises);

      currentDocumentPaths = [...currentDocumentPaths, ...newPaths];
    }

    const parseArrayFields = (value) => {
      if (value === undefined) return undefined;
      if (Array.isArray(value)) return value;

      if (value === "" || value === null) return [];

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    };

    const updatePayload = {
      ...(firstName !== undefined && { first_name: firstName }),
      ...(lastName !== undefined && { last_name: lastName }),
      ...(contactNumber !== undefined && { contact_no: contactNumber }),
      ...(address !== undefined && { address }),
      ...(dateOfBirth !== undefined && { birthday: dateOfBirth }),
      ...(age !== undefined && { age: parsedAge }),
      ...(gender !== undefined && { gender }),
      ...(bloodType !== undefined && { blood_type: bloodType }),
      ...(emergencyContactName !== undefined && {
        emergency_contact_name: emergencyContactName,
      }),
      ...(emergencyContactNumber !== undefined && {
        emergency_contact_no: emergencyContactNumber,
      }),
      ...(allergies !== undefined && {
        allergies: parseArrayFields(allergies),
      }),
      ...(chronicConditions !== undefined && {
        chronic_conditions: parseArrayFields(chronicConditions),
      }),
      ...(currentMedications !== undefined && {
        current_medications: parseArrayFields(currentMedications),
      }),
      profile_img_url: profileImageUrl,
      medical_report_urls: currentDocumentPaths,
    };

    console.log("Update payload for patient profile:", updatePayload);

    const { updatedProfile, updateError } = await updatePatientProfile(
      patient.id,
      updatePayload,
    );

    console.error(
      "updatePatientProfile - updatedProfile:",
      updatedProfile,
      "updateError:",
      updateError,
    );

    if (updateError || !updatedProfile) {
      throw new AppError("Failed to update patient profile", 500, updateError);
    }

    return {
      success: true,
      message: "Patient profile updated successfully",
      data: updatedProfile,
    };
  } catch (error) {
    console.error("Error in UpdatePatientProfileUsecase:", error);
    throw error;
  }
}
