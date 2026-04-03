import SessionRepository from "../repositories/session.repository.js";
import generateJitsiSession from "../utils/jitsiHelper.js";
import { ForbiddenError, InvalidInputError, NotFoundError } from "../utils/errors.utils.js";

const SessionService = {
  
  async getSessionsByUser(userId, role) {
    if (role === "patient") {
      return await SessionRepository.findByPatientId(userId);
    } else if (role === "doctor") {
      return await SessionRepository.findByDoctorId(userId);
    } else {
      throw new ForbiddenError("Invalid role for session access.");
    }
  },

  async getSessionById(sessionId, userId, role) {
    const session = await SessionRepository.findById(sessionId);

    // Make sure the requester owns this session
    if (role === "patient" && session.patient_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }
    if (role === "doctor" && session.doctor_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }

    return session;
  },

  async cancelSession(sessionId, userId, role) {
    const session = await SessionRepository.findById(sessionId);

    // Ownership check
    if (role === "patient" && session.patient_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }
    if (role === "doctor" && session.doctor_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }

    // Status check
    if (session.status !== "pending") {
      throw new InvalidInputError(
        `Session cannot be cancelled. Current status: ${session.status}`
      );
    }

    return await SessionRepository.cancelSession(sessionId);
  },

  async completeSession(sessionId, userId, notes) {
    const session = await SessionRepository.findById(sessionId);

    // Only the doctor of this session can complete it
    if (session.doctor_id !== parseInt(userId)) {
      throw new ForbiddenError("You do not have access to this session.");
    }

    // Status check
    if (session.status !== "active") {
      throw new InvalidInputError(
        `Session cannot be completed. Current status: ${session.status}`
      );
    }

    return await SessionRepository.completeSession(sessionId, notes);
  },
};

export default SessionService;