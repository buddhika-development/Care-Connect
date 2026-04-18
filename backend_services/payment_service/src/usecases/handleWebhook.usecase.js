import crypto from "crypto";
import axios from "axios";
import {
  updatePaymentByAppointmentId,
  findPaymentByAppointmentId,
} from "../repositories/payment.repository.js";
import { sendPaymentStatusSms } from "../utils/paymentSmsNotification.helper.js";

export async function HandleWebhookUsecase(webhookData) {
  // ── 1. Log incoming webhook for debugging ─────────────────────
  // Very useful when testing — you can see exactly what PayHere sends
  console.log("Webhook received from PayHere:", webhookData);

  const {
    merchant_id,
    order_id, // this is your appointmentId — you set this when initiating
    payment_id, // PayHere's own internal payment ID
    payhere_amount, // amount PayHere processed
    payhere_currency, // currency PayHere processed
    status_code, // most important field — tells you if payment succeeded
    md5sig, // PayHere's signature — you MUST verify this
  } = webhookData;

  // ── 2. Verify all required webhook fields exist ───────────────
  // If any of these are missing something is wrong with the request
  if (
    !merchant_id ||
    !order_id ||
    !payhere_amount ||
    !payhere_currency ||
    !status_code ||
    !md5sig
  ) {
    console.error("Webhook missing required fields:", webhookData);
    // Return false — caller will still respond 200 to PayHere
    return { verified: false, reason: "Missing required fields" };
  }

  // ── 3. Verify the webhook signature ───────────────────────────
  // THIS IS THE MOST IMPORTANT SECURITY STEP
  //
  // Without this check, anyone could send a fake webhook to your
  // notify_url and pretend a payment succeeded — giving themselves
  // a free appointment
  //
  // PayHere signs every webhook using this formula:
  // md5sig = MD5(merchantId + orderId + amount + currency + statusCode + MD5(secret).toUpperCase())
  //
  // You recreate the same signature locally and compare
  // If they match → webhook is genuine from PayHere
  // If they don't → reject immediately

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET.trim();

  // Step 1: hash the secret
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  // Step 2: recreate the full signature
  const expectedSignature = crypto
    .createHash("md5")
    .update(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        hashedSecret,
    )
    .digest("hex")
    .toUpperCase();

  // Step 3: compare — if they don't match, reject
  if (md5sig !== expectedSignature) {
    console.error(
      "Webhook signature verification FAILED — possible fraud attempt",
    );
    console.error("Expected:", expectedSignature);
    console.error("Received:", md5sig);
    return { verified: false, reason: "Invalid signature" };
  }

  console.log("Webhook signature verified successfully");

  // ── 4. Find the payment record in our DB ──────────────────────
  // order_id from PayHere = appointmentId we sent when initiating
  const payment = await findPaymentByAppointmentId(order_id);

  if (!payment) {
    console.error(`No payment record found for appointmentId: ${order_id}`);
    return {
      verified: true,
      processed: false,
      reason: "Payment record not found",
    };
  }

  // ── 5. Map PayHere status code to our own status ──────────────
  // PayHere uses numeric codes — we convert to readable strings
  //
  //  2  → payment success
  //  0  → pending (bank still processing — can happen with certain banks)
  // -1  → cancelled (user closed the payment page)
  // -2  → failed (card declined or error)
  // -3  → chargedback (customer disputed the charge)

  const statusMap = {
    2: "completed",
    0: "pending",
    "-1": "cancelled",
    "-2": "failed",
    "-3": "chargedback",
  };

  const newStatus = statusMap[status_code] || "unknown";
  console.log(`Payment status for appointment ${order_id}: ${newStatus}`);

  // ── 6. Update payment record in DB ────────────────────────────
  const updatedPayment = await updatePaymentByAppointmentId(order_id, {
    status: newStatus,
    payhere_payment_id: payment_id || null,
    payhere_response: webhookData, // store full raw response for debugging
  });

  console.log("Payment record updated in DB:", updatedPayment);

  // ── 7. If payment successful → notify Appointment Service ─────
  // Only do this when status_code is exactly "2" (success)
  // For pending/failed/cancelled we just update DB and do nothing else
  // ── 7. Notify Appointment Service regardless of payment status ─
  // Success → appointment becomes confirmed
  // Failed/Cancelled → appointment becomes cancelled
  // We always notify so appointment never stays stuck in pending

  // Map our payment status to what Appointment Service expects
  const appointmentPaymentStatus = status_code === "2" ? "paid" : "unpaid";

  try {
    await axios.patch(
      `${process.env.APPOINTMENT_SERVICE_URL}/api/internal/appointments/${order_id}/payment`,
      {
        paymentStatus: appointmentPaymentStatus,
        paymentId: updatedPayment.id || null,
      },
      {
        headers: {
          "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET,
          "x-service-name": "care-connect-payment-service",
        },
        timeout: 5000,
      },
    );
    console.log(
      `Appointment ${order_id} notified with payment status: ${appointmentPaymentStatus}`,
    );
  } catch (err) {
    // Don't throw — payment record is already updated in our DB
    // Appointment Service can be retried or fixed manually
    console.error(
      "Warning: Failed to notify appointment service:",
      err.message,
    );
  }

  const shouldSendSms =
    newStatus !== "unknown" &&
    (payment.status !== newStatus || payment.payhere_payment_id !== payment_id);

  if (shouldSendSms) {
    try {
      await sendPaymentStatusSms(updatedPayment, newStatus);
      console.log(
        `Payment notification sent for appointment ${order_id} with status ${newStatus}`,
      );
    } catch (error) {
      console.error(
        "Warning: Failed to send payment notification:",
        error.message,
      );
    }
  }

  return {
    verified: true,
    processed: true,
    status: newStatus,
    appointmentId: order_id,
  };
}
