import { getPatientMedicalRecordsByAppointmentService } from "../services/patientMedicalRecords.service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.utils.js";

export const getPatientMedicalRecordsByAppointmentController = async (
  req,
  res,
) => {
  try {
    const data = await getPatientMedicalRecordsByAppointmentService(
      req.user,
      req.params.appointmentId,
    );

    return sendSuccess(
      res,
      200,
      "Patient medical records fetched successfully",
      data,
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
};