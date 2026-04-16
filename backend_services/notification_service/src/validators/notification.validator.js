import Joi from "joi";
import { ValidationError } from "../utils/errors.utils.js";

const sendNotificationSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{7,14}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be in E.164 format (e.g. +94771234567)",
    }),
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).max(2000).required(),
}).or("email", "phone");

export const validateSendNotification = (body) => {
  const { error, value } = sendNotificationSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const fields = {};
    error.details.forEach((d) => {
      const key = d.path[0];
      fields[key] = d.message;
    });
    throw new ValidationError("Validation failed", fields);
  }

  return value;
};
