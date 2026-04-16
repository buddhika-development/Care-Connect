import axios from "axios";
import { serviceNames } from "../constants/serviceNames.constant.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors.utils.js";

const appointmentServiceClient = axios.create({
  baseURL: process.env.APPOINTMENT_SERVICE_URL,
  timeout: 7000,
});

const buildInternalHeaders = () => {
  if (!process.env.INTERNAL_SECRET) {
    throw new ValidationError("INTERNAL_SECRET is not configured");
  }

  return {
    "x-internal-secret": process.env.INTERNAL_SECRET,
    "x-service-name": serviceNames.DOCTOR_MANAGEMENT_SERVICE,
  };
};

export const getAppointmentByIdFromAppointmentService = async (appointmentId) => {
  if (!appointmentId) {
    throw new ValidationError("appointmentId is required");
  }

  try {
    const response = await appointmentServiceClient.get(
      `/api/internal/appointments/${appointmentId}`,
      {
        headers: buildInternalHeaders(),
      },
    );

    if (!response?.data?.data) {
      throw new NotFoundError("Appointment");
    }

    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new NotFoundError("Appointment");
    }

    throw error;
  }
};

export const getAppointmentForDoctor = async (appointmentId, doctorUserId) => {
  const appointment = await getAppointmentByIdFromAppointmentService(
    appointmentId,
  );

  if (appointment.doctor_id !== doctorUserId) {
    throw new ForbiddenError(
      "You are not allowed to access this appointment.",
    );
  }

  return appointment;
};
