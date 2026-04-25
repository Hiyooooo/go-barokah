import { badRequest } from "./error.factory.js";

export function parseNumber(value, fieldName = "value") {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw badRequest(`${fieldName} must be a valid number`);
  }

  return parsed;
}

export function parsePositiveInt(value, fieldName = "value") {
  const parsed = parseNumber(value, fieldName);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function parseNullableNumber(value, fieldName = "value") {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parseNumber(value, fieldName);
}
