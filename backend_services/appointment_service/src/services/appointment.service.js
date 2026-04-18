import AppointmentRepository from "../repositories/appointment.repository.js";
import { getAllDoctorsWithAvailability } from "../utils/doctorServiceHelper.js";
import { getPatientProfilesByUserIds } from "../utils/patientServiceHelper.js";
import {
  AppError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
} from "../utils/errors.utils.js";

function buildPatientName(profile = {}) {
  const fullName = [profile.first_name, profile.last_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unknown Patient";
}

function normalizeSlot(slot) {
  if (!slot || typeof slot !== "object") return null;

  return {
    id: slot.id || slot.slot_id || null,
    date: slot.date || null,
    start_time: slot.start_time || slot.startTime || null,
    end_time: slot.end_time || slot.endTime || null,
    is_booked: slot.is_booked ?? slot.isBooked ?? null,
  };
}

function indexDoctorsAndSlots(doctors = []) {
  const doctorMap = new Map();
  const slotMap = new Map();

  for (const doctor of doctors) {
    if (!doctor || typeof doctor !== "object") continue;

    const doctorUserId = doctor.user_id || doctor.userId || null;
    if (doctorUserId) {
      doctorMap.set(doctorUserId, {
        doctor_id: doctor.id || null,
        doctor_user_id: doctorUserId,
        doctor_name: doctor.full_name || doctor.fullName || "Unknown Doctor",
        doctor_specialization:
          doctor.specialization || doctor.speciality || doctor.department || "",
      });
    }

    const availabilities = Array.isArray(doctor.availabilities)
      ? doctor.availabilities
      : [];

    for (const availability of availabilities) {
      const slots = Array.isArray(availability?.slots)
        ? availability.slots
        : [];
      for (const slot of slots) {
        const normalizedSlot = normalizeSlot(slot);
        if (normalizedSlot?.id) {
          slotMap.set(normalizedSlot.id, normalizedSlot);
        }
      }
    }
  }

  return { doctorMap, slotMap };
}

const AppointmentService = {
  async createAppointment(
    patientId,
    doctorId,
    slotId,
    scheduledAt,
    channelingMode,
    consultationFee,
  ) {
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
      throw new InvalidInputError(
        "Date must be provided in YYYY-MM-DD format.",
      );
    }

    return await AppointmentRepository.findByDoctorIdAndDate(doctorId, date);
  },

  async getAllAppointmentsForAdmin() {
    const appointments = await AppointmentRepository.findAll();

    if (!appointments.length) {
      return [];
    }

    const patientIds = [
      ...new Set(appointments.map((item) => item.patient_id)),
    ];

    const [patientProfilesResult, doctorsResult] = await Promise.allSettled([
      getPatientProfilesByUserIds(patientIds),
      getAllDoctorsWithAvailability(),
    ]);

    if (patientProfilesResult.status === "rejected") {
      console.error(
        "Failed to fetch patient profiles for admin appointments:",
        patientProfilesResult.reason,
      );
    }

    if (doctorsResult.status === "rejected") {
      console.error(
        "Failed to fetch doctor details for admin appointments:",
        doctorsResult.reason,
      );
    }

    const patientProfiles =
      patientProfilesResult.status === "fulfilled"
        ? patientProfilesResult.value
        : [];
    const doctors =
      doctorsResult.status === "fulfilled" ? doctorsResult.value : [];

    const patientMap = new Map(
      (patientProfiles || []).map((profile) => [profile.user_id, profile]),
    );
    const { doctorMap, slotMap } = indexDoctorsAndSlots(doctors || []);

    return appointments.map((appointment) => {
      const patientProfile = patientMap.get(appointment.patient_id);
      const doctor = doctorMap.get(appointment.doctor_id);
      const slot = slotMap.get(appointment.slot_id);

      return {
        ...appointment,
        patient_name: buildPatientName(patientProfile),
        patient_email: patientProfile?.email || null,
        doctor_name: doctor?.doctor_name || "Unknown Doctor",
        doctor_specialization: doctor?.doctor_specialization || "",
        slot_date: slot?.date || null,
        slot_start_time: slot?.start_time || null,
        slot_end_time: slot?.end_time || null,
        slot_is_booked: slot?.is_booked ?? null,
      };
    });
  },
};

export default AppointmentService;
