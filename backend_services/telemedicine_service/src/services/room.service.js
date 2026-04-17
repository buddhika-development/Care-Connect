import SessionRepository from "../repositories/session.repository.js";
import { ForbiddenError, InvalidInputError } from "../utils/errors.utils.js";
import { buildJitsiJoinUrl, generateJitsiToken } from "../utils/jitsiHelper.js";

const sameUser = (ownerId, userId) => String(ownerId) === String(userId);

const RoomService = {
  async joinRoom(sessionId, userId, role) {
    const session = await SessionRepository.findById(sessionId);

    // Ownership check
    if (role === "patient" && !sameUser(session.patient_id, userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }
    if (role === "doctor" && !sameUser(session.doctor_id, userId)) {
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
    const token = generateJitsiToken(session.room_name, role);

    return {
      roomName: session.room_name,
      joinUrl: buildJitsiJoinUrl(session.room_name, token),
      status: session.status,
    };
  },

  async startRoom(sessionId, userId) {
    const session = await SessionRepository.findById(sessionId);

    // Only the doctor of this session can start it
    if (!sameUser(session.doctor_id, userId)) {
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