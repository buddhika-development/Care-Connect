import AppointmentService from "../services/appointment.service.js";
import AppointmentValidator from "../validators/appointment.validator.js";

const AppointmentController = {
  async createAppointment(req, res, next) {
    try {
      const { userId } = req.user;
      const { doctorId, slotId, scheduledAt, channelingMode, consultationFee } =
        req.body;

      AppointmentValidator.validateCreateAppointment({
        doctorId,
        slotId,
        scheduledAt,
        channelingMode,
        consultationFee,
      });

      console.log("Creating appointment with data:", {
        userId,
        doctorId,
        slotId,
        scheduledAt,
        channelingMode,
        consultationFee,
      });

      const appointment = await AppointmentService.createAppointment(
        userId,
        doctorId,
        slotId,
        scheduledAt,
        channelingMode,
        consultationFee,
      );

      console.log("Created appointment:", appointment);

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully.",
        data: appointment,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      next(error);
    }
  },

  async getAppointments(req, res, next) {
    try {
      const { userId, role } = req.user;

      const appointments = await AppointmentService.getAppointmentsByUser(
        userId,
        role,
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
        role,
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

  async getDoctorAppointmentsByDate(req, res, next) {
    try {
      const { userId } = req.user;
      const { date } = req.params;

      const appointments = await AppointmentService.getDoctorAppointmentsByDate(
        userId,
        date,
      );

      return res.status(200).json({
        success: true,
        message: "Doctor appointments for date retrieved successfully.",
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllAppointmentsForAdmin(req, res, next) {
    try {
      const appointments =
        await AppointmentService.getAllAppointmentsForAdmin();

      return res.status(200).json({
        success: true,
        message: "All appointments retrieved successfully.",
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AppointmentController;
