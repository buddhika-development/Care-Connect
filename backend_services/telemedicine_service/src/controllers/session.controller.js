import SessionService from "../services/session.service.js";
import SessionValidator from "../validators/session.validator.js";

const SessionController = {
  async getSessions(req, res, next) {
    try {
      const { userId, role } = req.user;
      const sessions = await SessionService.getSessionsByUser(userId, role);

      return res.status(200).json({
        success: true,
        message: "Sessions retrieved successfully.",
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessionById(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { sessionId } = req.params;

      const session = await SessionService.getSessionById(sessionId, userId, role);

      return res.status(200).json({
        success: true,
        message: "Session retrieved successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelSession(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { sessionId } = req.params;

      const session = await SessionService.cancelSession(sessionId, userId, role);

      return res.status(200).json({
        success: true,
        message: "Session cancelled successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  async completeSession(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      const { notes } = req.body;

      SessionValidator.validateCompleteSession({ notes });

      const session = await SessionService.completeSession(sessionId, userId, notes);

      return res.status(200).json({
        success: true,
        message: "Session completed successfully.",
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default SessionController;