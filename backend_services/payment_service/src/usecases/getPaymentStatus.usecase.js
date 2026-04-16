import { NotFoundError, ValidationError } from "../utils/errors.utils.js";
import { findPaymentByAppointmentId } from "../repositories/payment.repository.js";

export async function GetPaymentStatusUsecase(appointmentId, userId, role) {
  // ── 1. Validate ───────────────────────────────────────────────
  if (!appointmentId) {
    throw new ValidationError("appointmentId is required");
  }

  // ── 2. Find payment ───────────────────────────────────────────
  const payment = await findPaymentByAppointmentId(appointmentId);

  if (!payment) {
    throw new NotFoundError("No payment found for this appointment");
  }

  // ── 3. Authorization check ────────────────────────────────────
  // Patient can only see their own payment
  // Doctor and admin can see any payment
  if (role === "patient" && payment.patient_id !== userId) {
    throw new NotFoundError(
      "No payment found for this appointment",
      // Intentionally vague — don't tell them it exists but belongs to someone else
    );
  }

  // ── 4. Return clean payment data ──────────────────────────────
  // Don't return the full payhere_response — it has sensitive data
  return {
    appointmentId: payment.appointment_id,
    patientId: payment.patient_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    payherePaymentId: payment.payhere_payment_id,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}
