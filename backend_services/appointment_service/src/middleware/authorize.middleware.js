import { ForbiddenError } from "../utils/errors.utils.js";

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        throw new ForbiddenError("No role found on request.");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access restricted to: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorize;