import AppointmentRepository from "../repositories/appointment.repository.js";
import httpClient from "../utils/httpClient.js";
import {
  AppError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
} from "../utils/errors.utils.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import { updateSlotBookingStatus, getSlotDetails } from "../utils/doctorServiceHelper.js";
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
        `Appointment cannot be cancelled. Current status: ${appointment.appointment_status}`
      );
    }

    // Step 1 — Release slot in Doctor Service (must succeed)
    try {
      await updateSlotBookingStatus(appointment.slot_id, false);
    } catch (error) {
      throw new AppError("Failed to release slot. Cancellation aborted.", 503);
    }

    // Step 2 — Process refund if payment was made (graceful — can be done manually)
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
          { status: "cancelled" }
        );
      } catch (error) {
        throw new AppError(
          "Failed to cancel telemedicine session. Cancellation aborted.",
          503
        );
      }
    }

    // Step 4 — Cancel appointment
    return await AppointmentRepository.cancelAppointment(appointmentId);
  },

  async rescheduleAppointment(appointmentId, userId, newSlotId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (appointment.patient_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    const reschedulableStatuses = ["confirmed", "rescheduled"];
    if (!reschedulableStatuses.includes(appointment.appointment_status)) {
      throw new InvalidInputError(
        `Appointment cannot be rescheduled. Current status: ${appointment.appointment_status}`
      );
    }

    let newSlotData;
    try {
      newSlotData = await getSlotDetails(newSlotId);
    } catch (error) {
      throw new AppError("Failed to fetch slot details. Please try again.", 503);
    }

    if (!newSlotData) throw new NotFoundError("Slot");

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
          "This slot is not available for rescheduling."
        );
      }
    }

    const newScheduledAt = new Date(
      `${newSlotData.slot_date}T${newSlotData.slot_start_time}`
    );
    if (newScheduledAt < new Date()) {
      throw new InvalidInputError("Cannot reschedule to a past slot.");
    }

    const oldMode = appointment.channeling_mode;
    const newMode = newSlotData.channeling_mode;

    try {
      await updateSlotBookingStatus(appointment.slot_id, false);
    } catch (error) {
      throw new AppError("Failed to release old slot. Rescheduling aborted.", 503);
    }

    try {
      await updateSlotBookingStatus(newSlotId, true);
    } catch (error) {
      throw new AppError("Failed to book new slot. Rescheduling aborted.", 503);
    }

    if (oldMode === "online" && newMode === "physical") {
      if (appointment.telemedicine_session_id) {
        try {
          await httpClient.patch(
            TELEMEDICINE_SERVICE_URL,
            `/api/internal/telemedicine/sessions/${appointment.telemedicine_session_id}/status`,
            serviceNames.APPOINTMENT_SERVICE,
            { status: "cancelled" }
          );
        } catch (error) {
          throw new AppError(
            "Failed to cancel telemedicine session. Rescheduling aborted.",
            503
          );
        }
      }
    }

    if (oldMode === "physical" && newMode === "online") {
      try {
        const response = await httpClient.post(
          TELEMEDICINE_SERVICE_URL,
          `/api/internal/telemedicine/sessions`,
          serviceNames.APPOINTMENT_SERVICE,
          {
            appointmentId: appointment.id,
            patientId: appointment.patient_id,
            doctorId: appointment.doctor_id,
            scheduledAt: newScheduledAt.toISOString(),
          }
        );

        if (response.data?.id) {
          await AppointmentRepository.updateTelemedicineSession(
            appointment.id,
            response.data.id
          );
        }
      } catch (error) {
        throw new AppError(
          "Failed to create telemedicine session. Rescheduling aborted.",
          503
        );
      }
    }

    return await AppointmentRepository.updateSlot(
      appointmentId,
      newSlotId,
      newScheduledAt.toISOString(),
      newMode
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
        `Appointment cannot be started. Current status: ${appointment.appointment_status}`
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
        `Appointment cannot be completed. Current status: ${appointment.appointment_status}`
      );
    }

    return await AppointmentRepository.updateStatus(appointmentId, "completed");
  },
};

export default AppointmentStatusService;