import {
  createDoctorProfile,
  getAllDoctorsWithAvailability,
  findDoctorProfileByUserId,
  updateDoctorProfileByUserId,
  updateDoctorEmbedding,
} from "../repositories/doctorProfile.repository.js";
import {
  AppError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";
import { CompleteProfileService } from "./completeProfile.service.js";

// Create doctor profile by logged-in doctor
export const createMyDoctorProfileService = async (user, body) => {
  // Check logged-in user info exists
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  // Only doctors can create doctor profile
  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can create doctor profiles");
  }

  const {
    full_name,
    specialization,
    license_number,
    experience_years,
    room_number,
    bio,
  } = body;

  // Required field validation
  if (!full_name || !specialization || !room_number) {
    throw new ValidationError(
      "full_name, specialization, and room_number are required",
    );
  }

  // Check whether doctor profile already exists
  const existingProfileResult = await findDoctorProfileByUserId(user.userId);

  if (existingProfileResult.error) {
    throw new DatabaseError(existingProfileResult.error.message);
  }

  if (existingProfileResult.data) {
    throw new ValidationError("Doctor profile already exists");
  }

  // Create new doctor profile
  const { data, error } = await createDoctorProfile({
    user_id: user.userId,
    full_name,
    specialization,
    license_number: license_number || null,
    experience_years: experience_years ?? 0,
    room_number,
    bio: bio || null,
  });

  if (error) {
    throw new DatabaseError(error.message);
  }

  const serviceResponse = await CompleteProfileService(full_name, user.userId);
  console.log(
    "CompleteProfileService response in createMyDoctorProfileService:",
    serviceResponse,
  );

  if (serviceResponse.data.userId !== user.userId) {
    throw new ValidationError(
      "Profile completion failed for the created doctor profile",
    );
  }

  if (!serviceResponse.success) {
    throw new AppError("Failed to complete profile after creation", 500);
  }

  return data;
};

// View profile by logged-in doctor
export const getMyDoctorProfileService = async (user) => {
  // Check logged-in user info exists
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  // Only doctors can view their own doctor profile
  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can view doctor profiles");
  }

  const { data, error } = await findDoctorProfileByUserId(user.userId);

  if (error) {
    throw new DatabaseError(error.message);
  }

  if (!data) {
    throw new NotFoundError("Doctor profile not found");
  }

  return data;
};

// Update profile by logged-in doctor
export const updateMyDoctorProfileService = async (user, body) => {
  // Check logged-in user info exists
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  // Only doctors can update their own doctor profile
  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can update doctor profiles");
  }

  // Check whether doctor profile exists
  const existingProfileResult = await findDoctorProfileByUserId(user.userId);

  if (existingProfileResult.error) {
    throw new DatabaseError(existingProfileResult.error.message);
  }

  if (!existingProfileResult.data) {
    throw new NotFoundError("Doctor profile not found");
  }

  // Allow only selected fields to be updated
  const allowedUpdates = {
    full_name: body.full_name,
    specialization: body.specialization,
    license_number: body.license_number,
    experience_years: body.experience_years,
    room_number: body.room_number,
    bio: body.bio,
  };

  // Remove undefined fields so only provided values get updated
  const filteredUpdates = Object.fromEntries(
    Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined),
  );

  if (Object.keys(filteredUpdates).length === 0) {
    throw new ValidationError("No valid fields provided for update");
  }

  const serviceResponse = await CompleteProfileService(
    body.full_name,
    user.userId,
  );
  console.log(
    "CompleteProfileService response in createMyDoctorProfileService:",
    serviceResponse,
  );

  if (serviceResponse.data.userId !== user.userId) {
    throw new ValidationError(
      "Profile completion failed for the created doctor profile",
    );
  }

  if (!serviceResponse.success) {
    throw new AppError("Failed to complete profile after creation", 500);
  }

  const { data, error } = await updateDoctorProfileByUserId(
    user.userId,
    filteredUpdates,
  );

  if (error) {
    throw new DatabaseError(error.message);
  }

  return data;
};

// Get all doctors with their nested availability and slots
export const getAllDoctorsWithAvailabilityService = async (query = {}) => {
  const { specialization } = query;

  const { data, error } = await getAllDoctorsWithAvailability({
    specialization,
  });

  if (error) {
    throw new DatabaseError(error.message);
  }

  return data || [];
};

// Update doctor embedding (internal service call - no auth required)
export const updateDoctorEmbeddingService = async (doctorId, embeddingData) => {
  // Validate doctor ID
  if (!doctorId) {
    throw new ValidationError("Doctor ID is required");
  }

  // Validate embedding data
  if (!embeddingData) {
    throw new ValidationError("Embedding data is required");
  }

  // Validate embedding is an array (vector type)
  if (!Array.isArray(embeddingData)) {
    throw new ValidationError("Embedding must be a vector (array of numbers)");
  }

  // Validate embedding contains numbers
  if (embeddingData.length === 0) {
    throw new ValidationError("Embedding vector cannot be empty");
  }

  if (!embeddingData.every((item) => typeof item === "number")) {
    throw new ValidationError("All values in embedding must be numbers");
  }

  const { data, error } = await updateDoctorEmbedding(doctorId, embeddingData);

  if (error) {
    throw new DatabaseError(error.message);
  }

  if (!data) {
    throw new NotFoundError("Doctor profile not found");
  }

  return data;
};
