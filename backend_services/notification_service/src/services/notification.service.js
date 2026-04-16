import { sendEmail } from "./email.service.js";
import { sendSms } from "./sms.service.js";

/**
 * Dispatches notifications to all provided contact channels.
 * Sends email if `email` is provided, SMS if `phone` is provided.
 * Both channels are attempted independently; partial failures are captured.
 *
 * @param {{ email?: string, phone?: string, title: string, content: string }} payload
 * @returns {Promise<{ channels: Array<{ channel: string, status: string, detail?: string }> }>}
 */
export const dispatchNotification = async ({ email, phone, title, content }) => {
  const tasks = [];

  if (email) {
    tasks.push(
      sendEmail(email, title, content)
        .then((result) => ({ channel: "email", status: "sent", messageId: result.messageId }))
        .catch((err) => ({ channel: "email", status: "failed", detail: err.message }))
    );
  }

  if (phone) {
    tasks.push(
      sendSms(phone, title, content)
        .then((result) => ({ channel: "sms", status: "sent", sid: result.sid }))
        .catch((err) => ({ channel: "sms", status: "failed", detail: err.message }))
    );
  }

  const channels = await Promise.all(tasks);

  return { channels };
};
