import {
  cancelPrescriptionService,
  createPrescriptionService,
  getMyPrescriptionsService,
  getPrescriptionsByAppointmentService,
} from "../services/prescription.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.utils.js";

export const createPrescriptionController = async (req, res) => {
  try {
    const data = await createPrescriptionService(req.user, req.body);

    return sendSuccess(
      res,
      201,
      "Prescription created successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const getMyPrescriptionsController = async (req, res) => {
  try {
    const data = await getMyPrescriptionsService(req.user);

    return sendSuccess(
      res,
      200,
      "Prescriptions fetched successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const getPrescriptionsByAppointmentController = async (req, res) => {
  try {
    const data = await getPrescriptionsByAppointmentService(
      req.user,
      req.params.appointmentId,
    );

    return sendSuccess(
      res,
      200,
      "Appointment prescriptions fetched successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};

export const cancelPrescriptionController = async (req, res) => {
  try {
    const data = await cancelPrescriptionService(
      req.user,
      req.params.prescriptionId,
    );

    return sendSuccess(
      res,
      200,
      "Prescription cancelled successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};