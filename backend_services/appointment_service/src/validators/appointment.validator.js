import { MissingFieldError, InvalidInputError } from "../utils/errors.utils.js";

const AppointmentValidator = {
  validateCreateAppointment(data) {
    const { doctorId, slotId, reason } = data;

    // Required fields
    if (!doctorId) throw new MissingFieldError("doctorId");
    if (!slotId) throw new MissingFieldError("slotId");
    if (!reason) throw new MissingFieldError("reason");

    // Type checks
    if (typeof reason !== "string") {
      throw new InvalidInputError("reason must be a string.");
    }

    // Reason length check
    if (reason.trim().length < 10) {
      throw new InvalidInputError("reason must be at least 10 characters.");
    }
    if (reason.trim().length > 500) {
      throw new InvalidInputError("reason must not exceed 500 characters.");
    }
  },

  validateCancelAppointment(data) {
    const { cancelReason } = data;

    if (cancelReason && typeof cancelReason !== "string") {
      throw new InvalidInputError("cancelReason must be a string.");
    }

    if (cancelReason && cancelReason.trim().length === 0) {
      throw new InvalidInputError("cancelReason cannot be empty.");
    }
  },

  validateRescheduleAppointment(data) {
    const { newSlotId } = data;

    if (!newSlotId) throw new MissingFieldError("newSlotId");
  },

  validatePaymentUpdate(data) {
    const { paymentStatus, paymentId } = data;

    if (!paymentStatus) throw new MissingFieldError("paymentStatus");

    const allowedStatuses = ["paid", "unpaid"];
    if (!allowedStatuses.includes(paymentStatus)) {
      throw new InvalidInputError(
        `Invalid paymentStatus. Allowed values: ${allowedStatuses.join(", ")}`
      );
    }

    if (paymentStatus === "paid" && !paymentId) {
      throw new MissingFieldError("paymentId");
    }
  },

  validatePrescriptionUpdate(data) {
    const { prescriptionId } = data;

    if (!prescriptionId) throw new MissingFieldError("prescriptionId");
  },
};

export default AppointmentValidator;