import AppointmentRepository from "../repositories/appointment.repository.js";
import { getSlotDetails } from "../utils/doctorServiceHelper.js";
import {
  AppError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
} from "../utils/errors.utils.js";

const AppointmentService = {
  async createAppointment(patientId, doctorId, slotId, reason) {
    // Step 1 — Fetch real slot details from doctor service
    let slotData;
    try {
      slotData = await getSlotDetails(slotId);
    } catch (err) {
      throw new AppError(
        `Could not retrieve slot details: ${err.message}`,
        502
      );
    }

    if (!slotData) {
      throw new NotFoundError("Slot not found.");
    }

    // Step 2 — Check slot availability
    const existingAppointment =
      await AppointmentRepository.findBySlotId(slotId);
    if (existingAppointment) {
      const blockingStatuses = [
        "pending",
        "confirmed",
        "ongoing",
        "rescheduled",
        "completed",
      ];
      if (blockingStatuses.includes(existingAppointment.appointment_status)) {
        throw new InvalidInputError("This slot is not available for booking.");
      }
    }

    // Step 3 — Validate scheduled_at is not in the past
    const scheduledAt = new Date(
      `${slotData.slot_date}T${slotData.slot_start_time}`
    );
    if (scheduledAt < new Date()) {
      throw new InvalidInputError("Cannot book an appointment in the past.");
    }

    // Step 4 — Check same day conflicts for patient
    const appointmentDate = slotData.slot_date;
    const sameDay = await AppointmentRepository.findByPatientIdAndDate(
      patientId,
      appointmentDate
    );
    const activeSameDayAppointments = sameDay.filter((a) =>
      ["pending", "confirmed", "ongoing", "rescheduled"].includes(
        a.appointment_status
      )
    );
    if (activeSameDayAppointments.length > 0) {
      throw new InvalidInputError(
        "You already have an appointment on this day."
      );
    }

    // Step 5 — Create appointment
    const appointment = await AppointmentRepository.create({
      patient_id: patientId,
      doctor_id: doctorId,
      slot_id: slotId,
      channelling_mode: slotData.channelling_mode,
      consultation_fee: slotData.consultation_fee,
      scheduled_at: scheduledAt.toISOString(),
      reason,
      appointment_status: "pending",
      payment_status: "pending",
    });

    return appointment;
  },

  async getAppointmentsByUser(userId, role) {
    if (role === "patient") {
      return await AppointmentRepository.findByPatientId(userId);
    } else if (role === "doctor") {
      return await AppointmentRepository.findByDoctorId(userId);
    } else {
      throw new ForbiddenError("Invalid role for appointment access.");
    }
  },

  async getAppointmentById(appointmentId, userId, role) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (role === "patient" && appointment.patient_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }
    if (role === "doctor" && appointment.doctor_id !== userId) {
      throw new ForbiddenError("You do not have access to this appointment.");
    }

    return appointment;
  },
};

export default AppointmentService;