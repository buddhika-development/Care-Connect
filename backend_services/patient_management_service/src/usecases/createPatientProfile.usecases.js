import {
  findPatientProfileByUserId,
  insertPatientProfile,
  updatePatientProfile,
} from "../repositories/patientProfile.repository.js";
import {
  uploadMedicalDocument,
  uploadProfileImage,
} from "../repositories/storage.repository.js";
import { CompleteProfileService } from "../services/completeProfile.service.js";
import { analyzePatientMedicalDocuments } from "../services/documentAnalysis.service.js";
import {
  AppError,
  DatabaseError,
  InvalidEmailError,
  InvalidInputError,
  ValidationError,
} from "../utils/errors.utils.js";

export async function CreatePatientProfileUsecase(
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

    const { patient, patientError } = await findPatientProfileByUserId(userId);
    if (patient !== null) {
      if (patientError) {
        throw new DatabaseError("Error checking existing patient profile");
      }
    }

    let profileImageUrl = null;
    let medicalReportPaths = [];

    if (files?.profileImage?.[0]) {
      profileImageUrl = await uploadProfileImage(userId, files.profileImage[0]);
    }

    if (files?.medicalDocuments?.length > 0) {
      const uploadPromises = files.medicalDocuments.map((file) =>
        uploadMedicalDocument(userId, file),
      );
      medicalReportPaths = await Promise.all(uploadPromises);

      // Analyze medical documents via document service (batch processing)
      await analyzePatientMedicalDocuments(userId, medicalReportPaths);
    }

    const patientProfileData = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      contact_no: contactNumber,
      address,
      birthday: dateOfBirth,
      age: parsedAge,
      gender,
      blood_type: bloodType || null,
      profile_img_url: profileImageUrl,
      medical_report_urls: medicalReportPaths, // storing paths, not signed URLs
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_no: emergencyContactNumber || null,
      allergies: allergies || [],
      chronic_conditions: chronicConditions || [],
      current_medications: currentMedications || [],
    };

    if (patient) {
      const { updatedProfile, updateError } = await updatePatientProfile(
        patient.id,
        patientProfileData,
      );

      if (updateError || !updatedProfile) {
        throw new DatabaseError("Failed to update patient profile");
      }

      const serviceResponse = await CompleteProfileService(
        firstName,
        lastName,
        userId,
      );
      if (serviceResponse.data.userId !== userId) {
        throw new ValidationError(
          "Profile completion failed for the created profile",
        );
      }
      if (!serviceResponse.success) {
        throw new AppError("Failed to complete profile after creation", 500);
      }

      return {
        success: true,
        message: "Patient profile created and completed successfully!",
        data: updatedProfile,
      };
    }

    if (!patient) {
      const { data, error } = await insertPatientProfile(patientProfileData);

      if (error || !data) {
        throw new DatabaseError("Failed to create patient profile");
      }
      const serviceResponse = await CompleteProfileService(
        firstName,
        lastName,
        userId,
      );
      if (serviceResponse.data.userId !== userId) {
        throw new ValidationError(
          "Profile completion failed for the created profile",
        );
      }
      if (!serviceResponse.success) {
        throw new AppError("Failed to complete profile after creation", 500);
      }

      return {
        success: true,
        message: "Patient profile created and completed successfully!",
        data: data,
      };
    }
  } catch (error) {
    console.error("Error in CreatePatientProfileUsecase:", error);
    throw error;
  }
}
