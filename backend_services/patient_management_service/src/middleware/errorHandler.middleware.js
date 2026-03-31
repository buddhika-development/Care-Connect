import {
  AccountDisabledError,
  AppError,
  DatabaseError,
  DuplicateError,
  ForbiddenError,
  InvalidEmailError,
  InvalidInputError,
  InvalidPasswordError,
  InvalidTokenError,
  MissingFieldError,
  NotFoundError,
  TokenExpiredError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.utils.js";

export const errorHandler = (err, req, res, next) => {
  logError(err, req);

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: err.message,
      action: "Please log in to access this resource",
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: err.message,
      action: "You do not have permission to access this resource",
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: "Token Expired",
      message: err.message,
      action: "Please log in again to refresh your session",
    });
  }

  if (err instanceof InvalidTokenError) {
    return res.status(401).json({
      success: false,
      error: "Invalid Token",
      message: err.message,
      action: "Please log in again to obtain a valid token",
    });
  }

  if (err instanceof AccountDisabledError) {
    return res.status(403).json({
      success: false,
      error: "Account Disabled",
      message: err.message,
      action:
        "Your account has been disabled. Please contact support for assistance.",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      message: "Authentication token is invalid",
      action: "Please login again",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      message: "Your session has expired",
      action: "Please login again",
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      message: err.message,
      fields: err.fields, // Field-specific errors
    });
  }

  if (err instanceof MissingFieldError) {
    return res.status(400).json({
      success: false,
      error: "Missing field",
      message: err.message,
      field: err.field,
    });
  }

  if (err instanceof InvalidInputError) {
    return res.status(400).json({
      success: false,
      error: "Invalid input",
      message: err.message,
    });
  }

  if (err instanceof InvalidEmailError) {
    return res.status(400).json({
      success: false,
      error: "Invalid email",
      message: err.message,
    });
  }

  if (err instanceof InvalidPasswordError) {
    return res.status(400).json({
      success: false,
      error: "Invalid password",
      message: err.message,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: "Not found",
      message: err.message,
      resource: err.resource,
    });
  }

  if (err instanceof DuplicateError) {
    return res.status(409).json({
      success: false,
      error: "Duplicate entry",
      message: err.message,
      field: err.field,
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(500).json({
      success: false,
      error: "Database error",
      message: "A database error occurred",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
    });
  }
};

function logError(err, req) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id || "anonymous",
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    console.error("SERVER ERROR:", JSON.stringify(errorLog, null, 2));
  } else if (err.statusCode >= 400) {
    console.warn("CLIENT ERROR:", JSON.stringify(errorLog, null, 2));
  } else {
    console.log("ERROR:", JSON.stringify(errorLog, null, 2));
  }
}
