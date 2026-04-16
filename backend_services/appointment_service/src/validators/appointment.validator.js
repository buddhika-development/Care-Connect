import { MissingFieldError, InvalidInputError } from "../utils/errors.utils.js";

const AppointmentValidator = {
  validateCreateAppointment(data) {
    const { doctorId, slotId, scheduledAt, channelingMode, consultationFee } = data;

    if (!doctorId) throw new MissingFieldError("doctorId");
    if (!slotId) throw new MissingFieldError("slotId");
    if (!scheduledAt) throw new MissingFieldError("scheduledAt");
    if (!channelingMode) throw new MissingFieldError("channelingMode");
    if (!consultationFee) throw new MissingFieldError("consultationFee");

    const allowedModes = ["online", "physical"];
    if (!allowedModes.includes(channelingMode)) {
      throw new InvalidInputError(
        "channelingMode must be either online or physical."
      );
    }

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      throw new InvalidInputError("scheduledAt must be a valid date.");
    }

    if (typeof consultationFee !== "number" || consultationFee <= 0) {
      throw new InvalidInputError("consultationFee must be a positive number.");
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