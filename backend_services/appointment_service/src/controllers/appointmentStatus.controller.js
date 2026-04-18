import AppointmentStatusService from "../services/appointmentStatus.service.js";
import AppointmentValidator from "../validators/appointment.validator.js";

const AppointmentStatusController = {
  async cancelAppointment(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { appointmentId } = req.params;

      const appointment = await AppointmentStatusService.cancelAppointment(
        appointmentId,
        userId,
        role,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async rescheduleAppointment(req, res, next) {
    try {
      const { userId } = req.user;
      const { appointmentId } = req.params;
      const { newSlotId } = req.body;

      AppointmentValidator.validateRescheduleAppointment({
        newSlotId,
      });

      const appointment = await AppointmentStatusService.rescheduleAppointment(
        appointmentId,
        userId,
        newSlotId,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async startAppointment(req, res, next) {
    try {
      const { userId } = req.user;
      const { appointmentId } = req.params;

      const appointment = await AppointmentStatusService.startAppointment(
        appointmentId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment started successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async completeAppointment(req, res, next) {
    try {
      const { userId } = req.user;
      const { appointmentId } = req.params;

      const appointment = await AppointmentStatusService.completeAppointment(
        appointmentId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment completed successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AppointmentStatusController;
