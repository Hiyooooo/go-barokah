export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function isEmptyValue(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

export function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function isEmail(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(value.trim());
}

export function isValidUrl(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isLocalUploadPath(value, uploadPath) {
  return isNonEmptyString(value) && value.startsWith(`${uploadPath}/`);
}

export function isNumberInRange(value, min, max) {
  return isValidNumber(value) && value >= min && value <= max;
}
