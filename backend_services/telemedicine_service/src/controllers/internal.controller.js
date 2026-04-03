import InternalService from "../services/internal.service.js";
import SessionValidator from "../validators/session.validator.js";

const InternalController = {
  async createSession(req, res, next) {
    try {
      const { appointmentId, patientId, doctorId, scheduledAt } = req.body;

      SessionValidator.validateCreateSession({
        appointmentId,
        patientId,
        doctorId,
        scheduledAt,
      });

      const session = await InternalService.createSession(
        appointmentId,
        patientId,
        doctorId,
        scheduledAt
      );

      return res.status(201).json({
        success: true,
        message: "Session created successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessionByAppointmentId(req, res, next) {
    try {
      const { appointmentId } = req.params;

      const session =
        await InternalService.getSessionByAppointmentId(appointmentId);

      return res.status(200).json({
        success: true,
        message: "Session retrieved successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  async syncSessionStatus(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;

      SessionValidator.validateSyncStatus({ status });

      const session = await InternalService.syncSessionStatus(sessionId, status);

      return res.status(200).json({
        success: true,
        message: "Session status synced successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default InternalController;