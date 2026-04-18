import AppointmentRepository from "../repositories/appointment.repository.js";
import httpClient from "../utils/httpClient.js";
import {
  AppError,
  ForbiddenError,
  InvalidInputError,
} from "../utils/errors.utils.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import {
  updateSlotBookingStatus,
  getSlotDetailsById,
} from "../utils/doctorServiceHelper.js";
import { requestRefund } from "../utils/paymentServiceHelper.js";

const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL;

const AppointmentStatusService = {
  async cancelAppointment(appointmentId, userId, role) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    // Ownership check
    if (role === "patient" && appointment.patient_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }
    if (role === "doctor" && appointment.doctor_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    // Status check
    const cancellableStatuses = [
      "pending",
      "confirmed",
      "ongoing",
      "rescheduled",
    ];
    if (!cancellableStatuses.includes(appointment.appointment_status)) {
      throw new InvalidInputError(
        `Appointment cannot be cancelled. Current status: ${appointment.appointment_status}`,
      );
    }

    // Step 1 — Release slot in Doctor Service (must succeed)
    try {
      await updateSlotBookingStatus(appointment.slot_id, false);
    } catch (error) {
      throw new AppError("Failed to release slot. Cancellation aborted.", 503);
    }

    // Step 2 — Process refund if payment was made (graceful)
    if (appointment.payment_status === "paid") {
      try {
        await requestRefund(appointment.payment_id, appointmentId);
      } catch (error) {
        console.error("Failed to process refund:", error.message);
      }
    }

    // Step 3 — Cancel telemedicine session if online (must succeed)
    if (
      appointment.channeling_mode === "online" &&
      appointment.telemedicine_session_id
    ) {
      try {
        await httpClient.patch(
          TELEMEDICINE_SERVICE_URL,
          `/api/internal/telemedicine/sessions/${appointment.telemedicine_session_id}/status`,
          serviceNames.APPOINTMENT_SERVICE,
          { status: "cancelled" },
        );
      } catch (error) {
        throw new AppError(
          "Failed to cancel telemedicine session. Cancellation aborted.",
          503,
        );
      }
    }

    // Step 4 — Cancel appointment
    return await AppointmentRepository.cancelAppointment(appointmentId);
  },

  async rescheduleAppointment(appointmentId, userId, newSlotId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    // Ownership check — only patient can reschedule
    if (appointment.patient_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    // Status check
    const reschedulableStatuses = ["confirmed", "rescheduled"];
    if (!reschedulableStatuses.includes(appointment.appointment_status)) {
      throw new InvalidInputError(
        `Appointment cannot be rescheduled. Current status: ${appointment.appointment_status}`,
      );
    }

    if (appointment.slot_id === newSlotId) {
      throw new InvalidInputError(
        "Please select a different slot to reschedule.",
      );
    }

    // Step 1 — Check new slot availability
    const existingAppointment =
      await AppointmentRepository.findBySlotId(newSlotId);
    if (existingAppointment) {
      const blockingStatuses = [
        "pending",
        "confirmed",
        "ongoing",
        "rescheduled",
        "completed",
      ];
      if (blockingStatuses.includes(existingAppointment.appointment_status)) {
        throw new InvalidInputError(
          "This slot is not available for rescheduling.",
        );
      }
    }

    // Step 2 — Fetch slot details and enforce same-doctor/day rules
    const slotDetails = await getSlotDetailsById(newSlotId);
    const availabilityRelation = slotDetails?.doctor_availability;
    const availability = Array.isArray(availabilityRelation)
      ? availabilityRelation[0]
      : availabilityRelation;
    const doctorProfileRelation = availability?.doctor_profiles;
    const doctorProfile = Array.isArray(doctorProfileRelation)
      ? doctorProfileRelation[0]
      : doctorProfileRelation;
    const profileUserId = doctorProfile?.user_id;

    if (!availability || !profileUserId) {
      throw new InvalidInputError("Selected slot details are invalid.");
    }

    if (profileUserId !== appointment.doctor_id) {
      throw new InvalidInputError(
        "You can only reschedule within the same doctor's slots.",
      );
    }

    if (availability.status !== "scheduled") {
      throw new InvalidInputError(
        "Cannot reschedule because this doctor's day has already started or completed.",
      );
    }

    if (availability.channeling_mode !== appointment.channeling_mode) {
      throw new InvalidInputError(
        "Consultation type cannot be changed during reschedule.",
      );
    }

    const newScheduledAt = `${slotDetails.slot_date}T${slotDetails.slot_start_time}`;
    const newScheduledAtDate = new Date(newScheduledAt);

    // Step 3 — Validate new scheduled_at is not in the past
    if (newScheduledAtDate < new Date()) {
      throw new InvalidInputError("Cannot reschedule to a past slot.");
    }

    // Step 4 — Release old slot (must succeed)
    try {
      await updateSlotBookingStatus(appointment.slot_id, false);
    } catch (error) {
      throw new AppError(
        "Failed to release old slot. Rescheduling aborted.",
        503,
      );
    }

    // Step 5 — Book new slot (must succeed)
    try {
      await updateSlotBookingStatus(newSlotId, true);
    } catch (error) {
      throw new AppError("Failed to book new slot. Rescheduling aborted.", 503);
    }

    // Step 6 — Update appointment with new slot only (mode remains unchanged)
    return await AppointmentRepository.updateSlot(
      appointmentId,
      newSlotId,
      newScheduledAtDate.toISOString(),
      appointment.channeling_mode,
    );
  },

  async startAppointment(appointmentId, userId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (appointment.doctor_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    const startableStatuses = ["confirmed", "rescheduled"];
    if (!startableStatuses.includes(appointment.appointment_status)) {
      throw new InvalidInputError(
        `Appointment cannot be started. Current status: ${appointment.appointment_status}`,
      );
    }

    return await AppointmentRepository.updateStatus(appointmentId, "ongoing");
  },

  async completeAppointment(appointmentId, userId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (appointment.doctor_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    if (appointment.appointment_status !== "ongoing") {
      throw new InvalidInputError(
        `Appointment cannot be completed. Current status: ${appointment.appointment_status}`,
      );
    }

    return await AppointmentRepository.updateStatus(appointmentId, "completed");
  },
};

export default AppointmentStatusService;
