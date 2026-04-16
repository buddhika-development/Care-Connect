import {
  createDoctorAvailabilityService,
  getMyDoctorAvailabilitiesService,
  updateDoctorAvailabilityService,
  cancelDoctorAvailabilityService,
  updateAvailabilitySlotBookStatusService,
  getAvailabilitySlotDetailsByIdService,
} from "../services/doctorAvailability.service.js";
import { sendSuccess, sendError } from "../utils/apiResponse.utils.js";

export const createDoctorAvailabilityController = async (req, res) => {
  try {
    const data = await createDoctorAvailabilityService(req.user, req.body);
    return sendSuccess(res, 201, "Availability created successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const getMyDoctorAvailabilitiesController = async (req, res) => {
  try {
    const data = await getMyDoctorAvailabilitiesService(req.user);
    return sendSuccess(res, 200, "Availability fetched successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const updateDoctorAvailabilityController = async (req, res) => {
  try {
    const data = await updateDoctorAvailabilityService(
      req.user,
      req.params.availabilityId,
      req.body,
    );
    return sendSuccess(res, 200, "Availability updated successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const cancelDoctorAvailabilityController = async (req, res) => {
  try {
    const data = await cancelDoctorAvailabilityService(
      req.user,
      req.params.availabilityId,
    );
    return sendSuccess(res, 200, "Availability cancelled successfully", data);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const updateAvailabilitySlotBookStatusController = async (req, res) => {
  try {
    const data = await updateAvailabilitySlotBookStatusService(
      req.params.slotId,
      req.body,
    );
    return sendSuccess(
      res,
      200,
      "Availability slot booking status updated successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

// ── Internal: fetch slot by ID (called by appointment service) ───────────────
export const getAvailabilitySlotDetailsByIdController = async (req, res) => {
  try {
    const { slotId } = req.params;

    const data = await getAvailabilitySlotDetailsByIdService(slotId);

    return sendSuccess(
      res,
      200,
      "Availability slot details fetched successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};
