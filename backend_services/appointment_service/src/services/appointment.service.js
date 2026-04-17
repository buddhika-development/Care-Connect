import AppointmentRepository from "../repositories/appointment.repository.js";
import {
  AppError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
} from "../utils/errors.utils.js";

const AppointmentService = {
  async createAppointment(patientId, doctorId, slotId, scheduledAt, channelingMode, consultationFee) {
    // Step 1 — Check slot availability
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

    // Step 2 — Validate scheduled_at is not in the past
    const scheduledAtDate = new Date(scheduledAt);
    if (scheduledAtDate < new Date()) {
      throw new InvalidInputError("Cannot book an appointment in the past.");
    }

    // Step 3 — Create appointment
    const appointment = await AppointmentRepository.create({
      patient_id: patientId,
      doctor_id: doctorId,
      slot_id: slotId,
      channeling_mode: channelingMode,
      consultation_fee: consultationFee,
      scheduled_at: scheduledAtDate.toISOString(),
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

  async getDoctorAppointmentsByDate(doctorId, date) {
    if (!doctorId) {
      throw new InvalidInputError("Doctor ID is required.");
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InvalidInputError("Date must be provided in YYYY-MM-DD format.");
    }

    return await AppointmentRepository.findByDoctorIdAndDate(doctorId, date);
  },
};

export default AppointmentService;