import InternalService from "../services/internal.service.js";
import AppointmentValidator from "../validators/appointment.validator.js";

const InternalController = {
  async getAppointmentById(req, res, next) {
    try {
      const { appointmentId } = req.params;

      const appointment =
        await InternalService.getAppointmentById(appointmentId);

      return res.status(200).json({
        success: true,
        message: "Appointment retrieved successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAppointmentsByDoctorAndDate(req, res, next) {
    try {
      const { doctorId, date } = req.params;

      const appointments = await InternalService.getAppointmentsByDoctorAndDate(
        doctorId,
        date,
      );

      return res.status(200).json({
        success: true,
        message: "Appointments retrieved successfully.",
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAppointmentsByPatient(req, res, next) {
    try {
      const { patientId } = req.params;

      const appointments =
        await InternalService.getAppointmentsByPatient(patientId);

      return res.status(200).json({
        success: true,
        message: "Appointments retrieved successfully.",
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAppointmentBySlotId(req, res, next) {
    try {
      const { slotId } = req.params;

      const appointment = await InternalService.getAppointmentBySlotId(slotId);

      return res.status(200).json({
        success: true,
        message: "Appointment retrieved successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async handlePaymentUpdate(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { paymentStatus, paymentId } = req.body;

      console.log("Received payment update:", {
        appointmentId,
        paymentStatus,
        paymentId,
      });

      AppointmentValidator.validatePaymentUpdate({ paymentStatus, paymentId });

      const appointment = await InternalService.handlePaymentUpdate(
        appointmentId,
        paymentStatus,
        paymentId,
      );

      return res.status(200).json({
        success: true,
        message: "Payment status updated successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default InternalController;
