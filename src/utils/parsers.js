import { badRequest } from "./error.factory.js";
import { isEmptyValue } from "./validators.js";

export function parseNumber(value, fieldName = "value") {
  if (isEmptyValue(value)) {
    throw badRequest(`${fieldName} must be a valid number`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
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

export function parseNonNegativeNumber(value, fieldName = "value") {
  const parsed = parseNumber(value, fieldName);

  if (parsed < 0) {
    throw badRequest(`${fieldName} must be a number >= 0`);
  }

  return parsed;
}

export function parseNonNegativeInteger(value, fieldName = "value") {
  const parsed = parseNumber(value, fieldName);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${fieldName} must be an integer >= 0`);
  }

  return parsed;
}

export function parseIntegerInRange(value, fieldName = "value", min, max) {
  const parsed = parseNumber(value, fieldName);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw badRequest(
      `${fieldName} must be an integer between ${min} and ${max}`,
    );
  }

  return parsed;
}

export function parseNullableNumber(value, fieldName = "value") {
  if (isEmptyValue(value)) {
    return null;
  }

  return parseNumber(value, fieldName);
}
