import SessionRepository from "../repositories/session.repository.js";
import generateJitsiSession from "../utils/jitsiHelper.js";
import { InvalidInputError } from "../utils/errors.utils.js";

const InternalService = {
  async createSession(appointmentId, patientId, doctorId, scheduledAt) {
    // Check if session already exists for this appointment
    const existing = await SessionRepository.findByAppointmentId(appointmentId);
    if (existing) {
      throw new InvalidInputError(
        "A session already exists for this appointment."
      );
    }

    // Generate Jitsi room with plain join URLs (no embedded JWT token)
    const { roomName, patientJoinUrl, doctorJoinUrl } =
      generateJitsiSession(appointmentId);

    const session = await SessionRepository.create({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      room_name: roomName,
      patient_join_url: patientJoinUrl,
      doctor_join_url: doctorJoinUrl,
      scheduled_at: scheduledAt,
    });

    return session;
  },

  async getSessionByAppointmentId(appointmentId) {
    return await SessionRepository.findByAppointmentId(appointmentId);
  },

  async syncSessionStatus(sessionId, status) {
    const allowedStatuses = ["pending", "active", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      throw new InvalidInputError(`Invalid status: ${status}`);
    }

    return await SessionRepository.updateStatus(sessionId, status);
  },
};

export default InternalService;