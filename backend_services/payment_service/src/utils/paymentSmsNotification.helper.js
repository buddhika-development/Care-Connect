import axios from "axios";
import { getPatientProfileByUserId } from "./patientServiceHelper.js";

function normalizePhoneNumber(phone) {
  const raw = String(phone || "").trim();

  if (!raw) {
    return "";
  }

  if (raw.startsWith("+")) {
    return raw.replace(/\s+/g, "");
  }

  const digits = raw.replace(/\D/g, "");

  if (/^0\d{9}$/.test(digits)) {
    return `+94${digits.slice(1)}`;
  }

  if (/^94\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  return raw.replace(/\s+/g, "");
}

function formatAmount(amount, currency = "LKR") {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount)
    ? numericAmount.toFixed(2)
    : "0.00";
  return `${currency} ${safeAmount}`;
}

function buildNotificationContent(status, amount, currency) {
  const amountText = formatAmount(amount, currency);

  switch (status) {
    case "completed":
      return `We received your payment successfully. Amount: ${amountText}.`;
    case "pending":
      return `Your payment for ${amountText} is pending or was not completed successfully. Please try again or contact support.`;
    case "refunded":
      return `Your refund for ${amountText} was successful. The amount will be returned to your original payment method.`;
    case "failed":
    case "cancelled":
    case "chargedback":
      return `Your payment for ${amountText} was not successful.`;
    default:
      return "Your payment status has been updated.";
  }
}

export async function sendPaymentStatusSms(payment, status) {
  const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
  console.log(
    `Preparing to send payment status notification for payment ${payment?.id} with status ${status}, notification service URL: ${notificationServiceUrl}`,
  );

  if (!notificationServiceUrl) {
    throw new Error("NOTIFICATION_SERVICE_URL is not configured");
  }

  const profile = await getPatientProfileByUserId(payment?.patient_id);
  const phone = normalizePhoneNumber(profile?.contact_no);
  const email = String(profile?.email || "").trim();

  if (!phone && !email) {
    throw new Error(
      `No valid phone number or email found for patient ${payment?.patient_id}`,
    );
  }

  const content = buildNotificationContent(
    status,
    payment?.amount,
    payment?.currency || "LKR",
  );

  const payload = {
    title: "Care Connect Payment Update",
    content,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };

  const response = await axios.post(
    `${notificationServiceUrl}/api/notifications/send`,
    payload,
    {
      timeout: 5000,
    },
  );

  return response.data;
}
