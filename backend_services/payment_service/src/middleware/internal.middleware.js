import { ForbiddenError } from "../utils/errors.utils.js";

export const internalMiddleware = (req, res, next) => {
  try {
    const internalSecret = req.headers["x-internal-secret"];
    const serviceNameFromHeader = req.headers["x-service-name"];

    if (!internalSecret || !serviceNameFromHeader) {
      throw new ForbiddenError(
        "Missing required headers for internal communication.",
      );
    }

    if (internalSecret !== process.env.INTERNAL_SECRET) {
      throw new ForbiddenError("Invalid internal secret provided.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
