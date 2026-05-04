const EARTH_RADIUS_M = 6_371_000;

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinCheckpoint = (
  userLat: number,
  userLon: number,
  checkpoint: { latitude: number; longitude: number; radiusMeters: number },
): boolean =>
  haversineDistance(
    userLat,
    userLon,
    checkpoint.latitude,
    checkpoint.longitude,
  ) <= checkpoint.radiusMeters;

export const isOutOfRange = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  safeDistanceMeters = Number(process.env.DEFAULT_SAFE_DISTANCE_METERS ?? 200),
): boolean => haversineDistance(lat1, lon1, lat2, lon2) > safeDistanceMeters;
