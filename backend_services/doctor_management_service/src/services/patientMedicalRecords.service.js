import {
  ForbiddenError,
  ValidationError,
} from "../utils/errors.utils.js";
import { getAppointmentForDoctor } from "../utils/appointmentServiceHelper.js";
import { getPatientProfileById } from "../utils/patientServiceHelper.js";

export const getPatientMedicalRecordsByAppointmentService = async (
  user,
  appointmentId,
) => {
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can view patient medical records");
  }

  if (!appointmentId) {
    throw new ValidationError("appointmentId is required");
  }

  const appointment = await getAppointmentForDoctor(
    appointmentId,
    user.userId,
  );

  let patient = null;
  try {
    patient = await getPatientProfileById(appointment.patient_id, user);
  } catch (error) {
    if (error.statusCode === 404) {
      patient = null;
    } else {
      throw error;
    }
  }

  if (!patient) {
    return {
      appointment_id: appointmentId,
      patient_user_id: appointment.patient_id,
      blood_type: null,
      allergies: null,
      chronic_conditions: [],
      current_medications: [],
      medical_report_urls: [],
    };
  }

  return {
    appointment_id: appointmentId,
    patient_user_id: appointment.patient_id,
    blood_type: patient.blood_type || null,
    allergies: patient.allergies || null,
    chronic_conditions: patient.chronic_conditions || [],
    current_medications: patient.current_medications || [],
    medical_report_urls: patient.medical_report_urls || [],
  };
};