import crypto from "crypto";
import { ValidationError } from "../utils/errors.utils.js";
import {
  insertPayment,
  findPaymentByAppointmentId,
} from "../repositories/payment.repository.js";

export async function InitiatePaymentUsecase(patientId, paymentData) {
  const { appointmentId, amount, patientName, patientEmail, patientPhone } =
    paymentData;

  // ── 1. Validate required fields ───────────────────────────────
  if (!appointmentId || !amount || !patientName || !patientEmail) {
    throw new ValidationError(
      "appointmentId, amount, patientName and patientEmail are required",
    );
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    throw new ValidationError("Amount must be a positive number");
  }

  // ── 2. Check if payment already exists for this appointment ───
  // One appointment = one payment only
  const existing = await findPaymentByAppointmentId(appointmentId);

  if (existing && existing.status === "completed") {
    throw new ValidationError("Payment already completed for this appointment");
  }

  // ── 3. Prepare amount ─────────────────────────────────────────
  // PayHere requires exactly 2 decimal places — e.g. "2500.00"
  // toFixed(2) ensures this format
  const formattedAmount = parseFloat(amount).toFixed(2);
  const currency = "LKR";

  // ── 4. Generate PayHere hash ──────────────────────────────────
  // This is a security signature that proves the request came
  // from your server and wasn't tampered with
  //
  // Formula (from PayHere docs):
  // hash = MD5(merchantId + orderId + amount + currency + MD5(secret).toUpperCase())
  //
  // Step 1: hash the merchant secret first
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET.trim();
  const merchantId = process.env.PAYHERE_MERCHANT_ID.trim();

  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const hash = crypto
    .createHash("md5")
    .update(
      merchantId + appointmentId + formattedAmount + currency + hashedSecret,
    )
    .digest("hex")
    .toUpperCase();

  // ── 5. Save pending payment record to DB ──────────────────────
  // We save BEFORE sending to PayHere so we have a record
  // even if something goes wrong mid-payment
  // Status starts as "pending" — webhook will update it later
  if (!existing) {
    await insertPayment({
      appointment_id: appointmentId,
      patient_id: patientId,
      amount: formattedAmount,
      currency,
      status: "pending",
    });
  }

  // ── 6. Split patient name into first and last ─────────────────
  // PayHere requires separate first and last name fields
  const nameParts = patientName.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "-";
  // slice(1).join handles names with multiple parts like "De Silva"
  // If no last name provided, we use "-" so field is never empty

  // Temporary debug log — remove after fixing
  console.log("=== HASH DEBUG ===");
  console.log("merchantId:", merchantId);
  console.log("appointmentId:", appointmentId);
  console.log("amount:", formattedAmount);
  console.log("currency:", currency);
  console.log("merchantSecret:", merchantSecret);
  console.log("hashedSecret:", hashedSecret);
  console.log("finalHash:", hash);
  console.log("==================");

  // ── 7. Build and return PayHere checkout payload ──────────────
  // Frontend will use this to build the form and submit to PayHere
  return {
    checkoutData: {
      // PayHere required fields
      merchant_id: merchantId,
      return_url: `${process.env.FRONTEND_URL}/payment/return`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      notify_url: `${process.env.NOTIFY_URL}/api/payments/webhook`,

      // Order details
      order_id: appointmentId, // we use appointmentId as the order ID
      items: "Doctor Consultation Fee",
      currency,
      amount: formattedAmount,

      // Patient details
      first_name: firstName,
      last_name: lastName,
      email: patientEmail,
      phone: patientPhone || "",
      address: "N/A",
      city: "Colombo",
      country: "Sri Lanka",

      // Security hash — PayHere verifies this
      hash,
    },
    // Frontend submits a form POST to this URL
    paymentUrl: process.env.PAYHERE_BASE_URL,
  };
}
