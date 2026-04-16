import nodemailer from "nodemailer";
import { NotificationDeliveryError } from "../utils/errors.utils.js";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends an email notification.
 * @param {string} to - Recipient email address
 * @param {string} title - Email subject
 * @param {string} content - Email body (plain text)
 * @returns {Promise<{ messageId: string }>}
 */
export const sendEmail = async (to, title, content) => {
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Care Connect"}" <${process.env.SMTP_USER}>`,
      to,
      subject: title,
      text: content,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#2563eb;">${title}</h2>
        <p style="color:#374151;line-height:1.6;">${content}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px;" />
        <p style="font-size:12px;color:#9ca3af;">Care Connect — Your healthcare companion</p>
      </div>`,
    });

    return { messageId: info.messageId };
  } catch (err) {
    console.error("Email delivery failed:", err.message);
    throw new NotificationDeliveryError(`Email delivery failed: ${err.message}`);
  }
};
