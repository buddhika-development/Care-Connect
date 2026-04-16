import {
  createMyDoctorProfileService,
  getAllDoctorsWithAvailabilityService,
  getMyDoctorProfileService,
  updateMyDoctorProfileService,
  updateDoctorEmbeddingService,
} from "../services/doctorProfile.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.utils.js";

// Create doctor profile by logged-in doctor
export const createMyDoctorProfileController = async (req, res) => {
  try {
    const data = await createMyDoctorProfileService(req.user, req.body);

    return sendSuccess(res, 201, "Doctor profile created successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

// View my doctor profile by logged-in doctor
export const getMyDoctorProfileController = async (req, res) => {
  try {
    const data = await getMyDoctorProfileService(req.user);

    return sendSuccess(res, 200, "Doctor profile fetched successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

// Update my doctor profile by logged-in doctor
export const updateMyDoctorProfileController = async (req, res) => {
  try {
    const data = await updateMyDoctorProfileService(req.user, req.body);

    return sendSuccess(res, 200, "Doctor profile updated successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

// Get all doctors with nested availability and slots from the view
export const getAllDoctorsWithAvailabilityController = async (req, res) => {
  try {
    const data = await getAllDoctorsWithAvailabilityService(req.query);

    return sendSuccess(res, 200, "Doctors fetched successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

// Update doctor embedding (internal service-to-service call)
export const updateDoctorEmbeddingController = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { embedding } = req.body;

    const data = await updateDoctorEmbeddingService(doctorId, embedding);

    return sendSuccess(res, 200, "Doctor embedding updated successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};
