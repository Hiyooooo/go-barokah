import { AppError } from "./app-error.js";

function createHttpError(statusCode, message, options) {
  return new AppError(message, statusCode, options);
}

export function badRequest(message = "Bad request", options = {}) {
  return createHttpError(400, message, options);
}

export function unauthorized(message = "Unauthorized", options = {}) {
  return createHttpError(401, message, options);
}

export function forbidden(message = "Forbidden", options = {}) {
  return createHttpError(403, message, options);
}

export function notFound(message = "Resource not found", options = {}) {
  return createHttpError(404, message, options);
}

export function conflict(message = "Conflict", options = {}) {
  return createHttpError(409, message, options);
}

export function unprocessableEntity(
  message = "Unprocessable entity",
  options = {},
) {
  return createHttpError(422, message, options);
}

export function internalServerError(
  message = "Internal server error",
  options = {},
) {
  return createHttpError(500, message, {
    ...options,
    isOperational: options.isOperational ?? false,
  });
}
