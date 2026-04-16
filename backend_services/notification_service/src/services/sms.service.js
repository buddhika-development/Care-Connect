import twilio from "twilio";
import { NotificationDeliveryError } from "../utils/errors.utils.js";

const getClient = () => {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Resolves the Twilio sender config. Priority:
 *  1. TWILIO_MESSAGING_SERVICE_SID — recommended, handles routing automatically
 *  2. TWILIO_ALPHANUMERIC_SENDER   — e.g. "CareConnect" (up to 11 chars, no E.164 needed)
 *  3. TWILIO_PHONE_NUMBER          — must be a Twilio-purchased number in E.164 format
 */
const getSenderConfig = () => {
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    return { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID };
  }
  if (process.env.TWILIO_ALPHANUMERIC_SENDER) {
    return { from: process.env.TWILIO_ALPHANUMERIC_SENDER };
  }
  if (process.env.TWILIO_PHONE_NUMBER) {
    return { from: process.env.TWILIO_PHONE_NUMBER };
  }
  throw new NotificationDeliveryError(
    "No Twilio sender configured. Set TWILIO_MESSAGING_SERVICE_SID, TWILIO_ALPHANUMERIC_SENDER, or TWILIO_PHONE_NUMBER."
  );
};

/**
 * Sends an SMS notification via Twilio.
 * @param {string} to - Recipient phone number in E.164 format (e.g. +94771234567)
 * @param {string} title - Notification title (prepended to content)
 * @param {string} content - Notification body
 * @returns {Promise<{ sid: string }>}
 */
export const sendSms = async (to, title, content) => {
  const client = getClient();
  const senderConfig = getSenderConfig();
  const body = `[${title}]\n${content}`;

  try {
    const message = await client.messages.create({ to, body, ...senderConfig });
    return { sid: message.sid };
  } catch (err) {
    console.error("SMS delivery failed:", err.message);
    throw new NotificationDeliveryError(`SMS delivery failed: ${err.message}`);
  }
};
