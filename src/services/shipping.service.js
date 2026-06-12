import { badRequest, parseNumber } from "../utils/index.js";

export const SHIPPING_DISTANCE_RULES = {
  FREE_MAX_KM: 20,
  TIER_ONE_MAX_KM: 70,
  TIER_TWO_MAX_KM: 150,
  TIER_ONE_RATE: 0.015,
  TIER_TWO_RATE: 0.025,
};

export const STORE_COORDINATE_CONFIG_KEYS = {
  latitude: "STORE_LATITUDE",
  longitude: "STORE_LONGITUDE",
};

function validateCoordinateRange(value, fieldName, min, max) {
  if (value < min || value > max) {
    throw badRequest(`${fieldName} must be between ${min} and ${max}`);
  }
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function normalizeAddressCoordinates(payload = {}, options = {}) {
  const { required = false } = options;
  const hasLatitude = payload.latitude !== undefined;
  const hasLongitude = payload.longitude !== undefined;

  if (required && (!hasLatitude || !hasLongitude)) {
    throw badRequest("latitude and longitude are required");
  }

  if (hasLatitude !== hasLongitude) {
    throw badRequest("latitude and longitude must be provided together");
  }

  if (!hasLatitude && !hasLongitude) {
    return {
      latitude: undefined,
      longitude: undefined,
    };
  }

  const latitude = parseNumber(payload.latitude, "latitude");
  const longitude = parseNumber(payload.longitude, "longitude");

  validateCoordinateRange(latitude, "latitude", -90, 90);
  validateCoordinateRange(longitude, "longitude", -180, 180);

  return {
    latitude,
    longitude,
  };
}

export function getStoreCoordinatesFromEnv() {
  const latitudeValue = process.env[STORE_COORDINATE_CONFIG_KEYS.latitude];
  const longitudeValue = process.env[STORE_COORDINATE_CONFIG_KEYS.longitude];

  if (latitudeValue === undefined || longitudeValue === undefined) {
    throw new Error("Store coordinates are not configured");
  }

  const latitude = parseNumber(latitudeValue, STORE_COORDINATE_CONFIG_KEYS.latitude);
  const longitude = parseNumber(
    longitudeValue,
    STORE_COORDINATE_CONFIG_KEYS.longitude,
  );

  validateCoordinateRange(latitude, "STORE_LATITUDE", -90, 90);
  validateCoordinateRange(longitude, "STORE_LONGITUDE", -180, 180);

  return {
    latitude,
    longitude,
  };
}

export function calculateDistanceKmFromCoordinates({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
}) {
  const originLat = parseNumber(originLatitude, "originLatitude");
  const originLng = parseNumber(originLongitude, "originLongitude");
  const destinationLat = parseNumber(destinationLatitude, "destinationLatitude");
  const destinationLng = parseNumber(
    destinationLongitude,
    "destinationLongitude",
  );

  validateCoordinateRange(originLat, "originLatitude", -90, 90);
  validateCoordinateRange(originLng, "originLongitude", -180, 180);
  validateCoordinateRange(destinationLat, "destinationLatitude", -90, 90);
  validateCoordinateRange(destinationLng, "destinationLongitude", -180, 180);

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destinationLat - originLat);
  const longitudeDelta = toRadians(destinationLng - originLng);

  const haversineValue =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(destinationLat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return Number((earthRadiusKm * angularDistance).toFixed(2));
}

export function resolveShippingRateByDistance(distanceKm) {
  const parsedDistanceKm = parseNumber(distanceKm, "distanceKm");

  if (parsedDistanceKm < 0) {
    throw badRequest("distanceKm must be greater than or equal to 0");
  }

  if (parsedDistanceKm < SHIPPING_DISTANCE_RULES.FREE_MAX_KM) {
    return 0;
  }

  if (parsedDistanceKm < SHIPPING_DISTANCE_RULES.TIER_ONE_MAX_KM) {
    return SHIPPING_DISTANCE_RULES.TIER_ONE_RATE;
  }

  if (parsedDistanceKm <= SHIPPING_DISTANCE_RULES.TIER_TWO_MAX_KM) {
    return SHIPPING_DISTANCE_RULES.TIER_TWO_RATE;
  }

  throw badRequest(
    `Delivery is only available up to ${SHIPPING_DISTANCE_RULES.TIER_TWO_MAX_KM} km`,
  );
}

export function calculateShippingFeeFromDistance({
  itemsSubtotal,
  distanceKm,
  fulfillmentMethod = "DELIVERY",
}) {
  if (fulfillmentMethod === "PICKUP") {
    return 0;
  }

  const parsedItemsSubtotal = parseNumber(itemsSubtotal, "itemsSubtotal");

  if (parsedItemsSubtotal < 0) {
    throw badRequest("itemsSubtotal must be greater than or equal to 0");
  }

  const shippingRate = resolveShippingRateByDistance(distanceKm);
  return Math.round(parsedItemsSubtotal * shippingRate);
}

export function buildDeliveryShippingSummary({
  itemsSubtotal,
  address,
  storeCoordinates,
}) {
  const deliveryAddress = assertDeliveryAddressHasCoordinates(address);
  const storeLocation = storeCoordinates ?? getStoreCoordinatesFromEnv();
  const distanceKm = calculateDistanceKmFromCoordinates({
    originLatitude: storeLocation.latitude,
    originLongitude: storeLocation.longitude,
    destinationLatitude: deliveryAddress.latitude,
    destinationLongitude: deliveryAddress.longitude,
  });
  const shippingFee = calculateShippingFeeFromDistance({
    itemsSubtotal,
    distanceKm,
    fulfillmentMethod: "DELIVERY",
  });

  return {
    addressId: deliveryAddress.id ?? null,
    distanceKm,
    shippingFee,
    grandTotal: itemsSubtotal + shippingFee,
  };
}

export function assertDeliveryAddressHasCoordinates(address) {
  if (!address) {
    throw badRequest("Address is required");
  }

  if (address.latitude === null || address.latitude === undefined) {
    throw badRequest("Address latitude is required for delivery");
  }

  if (address.longitude === null || address.longitude === undefined) {
    throw badRequest("Address longitude is required for delivery");
  }

  return {
    ...address,
    latitude: parseNumber(address.latitude, "address.latitude"),
    longitude: parseNumber(address.longitude, "address.longitude"),
  };
}
