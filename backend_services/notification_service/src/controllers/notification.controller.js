import { validateSendNotification } from "../validators/notification.validator.js";
import { dispatchNotification } from "../services/notification.service.js";

const NotificationController = {
  async send(req, res, next) {
    try {
      const payload = validateSendNotification(req.body);
      const result = await dispatchNotification(payload);

      const allFailed = result.channels.every((c) => c.status === "failed");
      const statusCode = allFailed ? 502 : 200;

      return res.status(statusCode).json({
        success: !allFailed,
        message: allFailed
          ? "All notification channels failed"
          : "Notification dispatched",
        channels: result.channels,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default NotificationController;
