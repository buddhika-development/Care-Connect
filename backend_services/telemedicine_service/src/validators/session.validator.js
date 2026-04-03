import { MissingFieldError, InvalidInputError } from "../utils/errors.utils.js";

const SessionValidator = {
  validateCreateSession(data) {
    const { appointmentId, patientId, doctorId, scheduledAt } = data;

    if (!appointmentId) throw new MissingFieldError("appointmentId");
    if (!patientId) throw new MissingFieldError("patientId");
    if (!doctorId) throw new MissingFieldError("doctorId");
    if (!scheduledAt) throw new MissingFieldError("scheduledAt");

    if (isNaN(parseInt(appointmentId))) {
      throw new InvalidInputError("appointmentId must be a valid number.");
    }
    if (isNaN(parseInt(patientId))) {
      throw new InvalidInputError("patientId must be a valid number.");
    }
    if (isNaN(parseInt(doctorId))) {
      throw new InvalidInputError("doctorId must be a valid number.");
    }

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      throw new InvalidInputError("scheduledAt must be a valid date.");
    }
  },

  validateCompleteSession(data) {
    const { notes } = data;

    if (notes && typeof notes !== "string") {
      throw new InvalidInputError("notes must be a string.");
    }

    if (notes && notes.trim().length === 0) {
      throw new InvalidInputError("notes cannot be empty.");
    }
  },

  validateSyncStatus(data) {
    const { status } = data;

    if (!status) throw new MissingFieldError("status");

    const allowedStatuses = ["pending", "active", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      throw new InvalidInputError(
        `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
      );
    }
  },
};

export default SessionValidator;