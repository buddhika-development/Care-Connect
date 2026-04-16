import httpClient from "./httpClient.js";
import { serviceNames } from "../constant/serviceNames.constant.js";

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;

export const updateSlotBookingStatus = async (slotId, isBooked) => {
  await httpClient.patch(
    DOCTOR_SERVICE_URL,
    `/api/doctors/availability/slots/${slotId}/book-status`,
    serviceNames.APPOINTMENT_SERVICE,
    { is_booked: isBooked }
  );
};

export const getSlotDetails = async (slotId) => {
  const response = await httpClient.get(
    DOCTOR_SERVICE_URL,
    `/api/doctors/availability/slots/${slotId}`,
    serviceNames.APPOINTMENT_SERVICE
  );
  return response.data;
};