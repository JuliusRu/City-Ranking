export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Resource") {
    super(`${entity} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests", 429);
    this.name = "RateLimitError";
  }
}
