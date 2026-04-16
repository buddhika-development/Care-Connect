import httpClient from "./httpClient.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import { AppError } from "./errors.utils.js";

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

export const requestRefund = async (paymentId, appointmentId) => {
  await httpClient.post(
    PAYMENT_SERVICE_URL,
    `/api/internal/payments/${paymentId}/refund`,
    serviceNames.APPOINTMENT_SERVICE,
    { appointmentId }
  );
};