import axios from "axios";
import {
  ForbiddenError,
  ValidationError,
} from "../utils/errors.utils.js";

// TEMPORARY MOCK HELPER
// Later replace this with real appointment-service call
const getMockAppointmentById = async (appointmentId, doctorUserId) => {
  return {
    id: appointmentId,
    doctor_user_id: doctorUserId,
    patient_user_id: "f860f02e-d88e-486e-bf7b-989f0d727e6e",
    status: "accepted",
  };
};

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

  // TEMPORARY: mock appointment lookup
  const appointment = await getMockAppointmentById(appointmentId, user.userId);

  if (appointment.doctor_user_id !== user.userId) {
    throw new ForbiddenError(
      "You are not allowed to view medical records for this appointment",
    );
  }

  const patientResponse = await axios.get(
    `${process.env.PATIENT_SERVICE_URL}/api/patients/profile/${appointment.patient_user_id}`,
    {
        headers: {
        "x-user-id": user.userId,
        "x-user-email": user.email,
        "x-user-role": user.role,
        "x-gateway-secret": process.env.GATEWAY_SECRET,
        },
    },
   );

  const patient = patientResponse.data?.data;

  if (!patient) {
    return {
      appointment_id: appointmentId,
      patient_user_id: appointment.patient_user_id,
      blood_type: null,
      allergies: null,
      chronic_conditions: [],
      current_medications: [],
      medical_report_urls: [],
    };
  }

  return {
    appointment_id: appointmentId,
    patient_user_id: appointment.patient_user_id,
    blood_type: patient.blood_type || null,
    allergies: patient.allergies || null,
    chronic_conditions: patient.chronic_conditions || [],
    current_medications: patient.current_medications || [],
    medical_report_urls: patient.medical_report_urls || [],
  };
};