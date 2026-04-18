import twilio from "twilio";
import { NotificationDeliveryError } from "../utils/errors.utils.js";

const getClient = () => {
  // TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN are the two required credentials
  // Without Account SID, Twilio client can't authenticate at all
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const getSenderConfig = () => {
  // Priority order for sender — use whichever is configured
  // For now we just use TWILIO_PHONE_NUMBER since that's what you have

  // if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
  //   // MG... format — handles routing automatically
  //   return { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID };
  // }

  // if (process.env.TWILIO_ALPHANUMERIC_SENDER) {
  //   // Brand name like "CareConnect" — not supported in all countries
  //   return { from: process.env.TWILIO_ALPHANUMERIC_SENDER };
  // }

  if (process.env.TWILIO_PHONE_NUMBER) {
    // E.164 format like +17622043443
    return { from: process.env.TWILIO_PHONE_NUMBER };
  }

  throw new NotificationDeliveryError(
    "No Twilio sender configured. Set TWILIO_MESSAGING_SERVICE_SID, TWILIO_ALPHANUMERIC_SENDER, or TWILIO_PHONE_NUMBER.",
  );
};

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
