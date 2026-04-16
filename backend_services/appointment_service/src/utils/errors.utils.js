export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Operational errors (expected)
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = "Token has expired") {
    super(message, 401);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "Invalid token") {
    super(message, 401);
  }
}

export class AccountDisabledError extends AppError {
  constructor(message = "Account is disabled") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 400);
    this.fields = fields; // For field-specific errors
  }
}

export class MissingFieldError extends AppError {
  constructor(fieldName) {
    super(`${fieldName} missing!`, 400);
    this.field = fieldName;
  }
}

export class InvalidInputError extends AppError {
  constructor(message = "Invalid input provided") {
    super(message, 400);
  }
}

export class InvalidEmailError extends AppError {
  constructor(message = "Invalid email address") {
    super(message, 400);
  }
}

export class InvalidPasswordError extends AppError {
  constructor(message = "Invalid password format") {
    super(message, 400);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500);
  }
}

export class DuplicateError extends AppError {
  constructor(field) {
    super(`${field} already exists`, 409);
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.resource = resource;
  }
}
