import SessionRepository from "../repositories/session.repository.js";
import { ForbiddenError, InvalidInputError } from "../utils/errors.utils.js";

const RoomService = {
  async joinRoom(sessionId, userId, role) {
    const session = await SessionRepository.findById(sessionId);

    // Ownership check
    if (role === "patient" && session.patient_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }
    if (role === "doctor" && session.doctor_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }

    // Status check — can't join a cancelled or completed session
    if (session.status === "cancelled") {
      throw new InvalidInputError("Cannot join a cancelled session.");
    }
    if (session.status === "completed") {
      throw new InvalidInputError("Cannot join a completed session.");
    }

    // Return the correct URL based on role
    return {
      roomName: session.room_name,
      joinUrl: role === "patient" ? session.patient_join_url : session.doctor_join_url,
      status: session.status,
    };
  },

  async startRoom(sessionId, userId) {
    const session = await SessionRepository.findById(sessionId);

    // Only the doctor of this session can start it
    if (session.doctor_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }

    // Status check — can only start a pending session
    if (session.status !== "pending") {
      throw new InvalidInputError(
        `Session cannot be started. Current status: ${session.status}`
      );
    }

    return await SessionRepository.startSession(sessionId);
  },
};

export default RoomService;