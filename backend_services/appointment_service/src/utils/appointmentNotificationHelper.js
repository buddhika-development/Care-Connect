import httpClient from "./httpClient.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import { getPatientProfileByUserId } from "./patientServiceHelper.js";
import { AppError } from "./errors.utils.js";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value || "N/A");
  }

  return parsed.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function buildNotificationBody(appointment, eventType, options = {}) {
  const appointmentId = appointment?.id || "N/A";
  const scheduledAt = formatDateTime(appointment?.scheduled_at);
  const channelingMode = appointment?.channeling_mode || "N/A";
  const status = appointment?.appointment_status || "N/A";

  if (eventType === "placed") {
    return {
      title: "Appointment Placed Successfully",
      content:
        `Your appointment has been placed successfully.\n` +
        `Appointment ID: ${appointmentId}\n` +
        `Scheduled At: ${scheduledAt}\n` +
        `Consultation Type: ${channelingMode}\n` +
        `Status: ${status}`,
    };
  }

  if (eventType === "rescheduled") {
    const previousScheduledAt = formatDateTime(options.previousScheduledAt);
    return {
      title: "Appointment Rescheduled",
      content:
        `Your appointment has been rescheduled.\n` +
        `Appointment ID: ${appointmentId}\n` +
        `Previous Time: ${previousScheduledAt}\n` +
        `New Time: ${scheduledAt}\n` +
        `Consultation Type: ${channelingMode}\n` +
        `Status: ${status}`,
    };
  }

  if (eventType === "cancelled") {
    return {
      title: "Appointment Cancelled",
      content:
        `Your appointment has been cancelled.\n` +
        `Appointment ID: ${appointmentId}\n` +
        `Scheduled At: ${scheduledAt}\n` +
        `Consultation Type: ${channelingMode}\n` +
        `Status: ${status}`,
    };
  }

  return {
    title: "Appointment Update",
    content:
      `Your appointment has been updated.\n` +
      `Appointment ID: ${appointmentId}\n` +
      `Scheduled At: ${scheduledAt}\n` +
      `Status: ${status}`,
  };
}

export async function sendAppointmentEmailNotification(
  appointment,
  eventType,
  options = {},
) {
  if (!NOTIFICATION_SERVICE_URL) {
    throw new AppError("NOTIFICATION_SERVICE_URL is not configured.", 500);
  }

  const profile = await getPatientProfileByUserId(appointment?.patient_id);
  const email = String(profile?.email || "").trim();

  if (!email) {
    throw new AppError(
      `Patient email not found for user ${appointment?.patient_id}`,
      404,
    );
  }

  const payload = buildNotificationBody(appointment, eventType, options);

  return httpClient.post(
    NOTIFICATION_SERVICE_URL,
    "/api/notifications/send",
    serviceNames.APPOINTMENT_SERVICE,
    {
      email,
      title: payload.title,
      content: payload.content,
    },
  );
}
