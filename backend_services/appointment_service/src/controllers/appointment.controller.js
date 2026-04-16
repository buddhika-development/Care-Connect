import AppointmentService from "../services/appointment.service.js";
import AppointmentValidator from "../validators/appointment.validator.js";

const AppointmentController = {
  async createAppointment(req, res, next) {
    try {
      const { userId } = req.user;
      const { doctorId, slotId } = req.body;

      AppointmentValidator.validateCreateAppointment({ doctorId, slotId });

      const appointment = await AppointmentService.createAppointment(
        userId,
        doctorId,
        slotId
      );

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAppointments(req, res, next) {
    try {
      const { userId, role } = req.user;

      const appointments = await AppointmentService.getAppointmentsByUser(
        userId,
        role
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

  async getAppointmentById(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { appointmentId } = req.params;

      const appointment = await AppointmentService.getAppointmentById(
        appointmentId,
        userId,
        role
      );

      return res.status(200).json({
        success: true,
        message: "Appointment retrieved successfully.",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AppointmentController;