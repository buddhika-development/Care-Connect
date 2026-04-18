import { ValidationError } from "../utils/errors.utils.js";
import {
  findPaymentById,
  updatePaymentStatusById,
} from "../repositories/payment.repository.js";
import { sendPaymentStatusSms } from "../utils/paymentSmsNotification.helper.js";

export async function RefundPaymentInternalUsecase(paymentId) {
  if (!paymentId) {
    throw new ValidationError("paymentId is required");
  }

  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new ValidationError("Payment not found");
  }

  if (payment.status === "refunded") {
    return {
      id: payment.id,
      appointmentId: payment.appointment_id,
      status: payment.status,
      updatedAt: payment.updated_at,
    };
  }

  const updatedPayment = await updatePaymentStatusById(paymentId, "refunded");

  try {
    await sendPaymentStatusSms(updatedPayment, "refunded");
  } catch (error) {
    console.error(
      "Warning: Failed to send refund notification:",
      error.message,
    );
  }

  return {
    id: updatedPayment.id,
    appointmentId: updatedPayment.appointment_id,
    status: updatedPayment.status,
    updatedAt: updatedPayment.updated_at,
  };
}
