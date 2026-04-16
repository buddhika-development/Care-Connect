import { MissingFieldError, InvalidInputError } from "../utils/errors.utils.js";

const AppointmentValidator = {
  validateCreateAppointment(data) {
    const { doctorId, slotId } = data;

    if (!doctorId) throw new MissingFieldError("doctorId");
    if (!slotId) throw new MissingFieldError("slotId");
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