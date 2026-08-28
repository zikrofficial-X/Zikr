/**
 * Qibla Direction Finder Service
 * Calculates the direction to Mecca (Qibla) from any location
 */

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface QiblaDirection {
  direction: number; // Degrees from North (0-360)
  directionName: string; // e.g., "North", "Northeast", etc.
  meccaLatitude: number;
  meccaLongitude: number;
}

// Mecca coordinates
const MECCA_LATITUDE = 21.4225;
const MECCA_LONGITUDE = 39.8262;

/**
 * Calculate the bearing (direction) from point A to point B
 * Returns degrees from North (0-360)
 */
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos(dLon);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  return bearing;
}

/**
 * Convert bearing degrees to direction name
 */
function bearingToDirectionName(bearing: number): string {
  const directions = [
    'شمال',
    'شمال شرقي',
    'شرق',
    'جنوب شرقي',
    'جنوب',
    'جنوب غربي',
    'غرب',
    'شمال غربي',
  ];

  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate Qibla direction from given coordinates
 */
export function calculateQibla(
  location: LocationCoordinates
): QiblaDirection {
  const bearing = calculateBearing(
    location.latitude,
    location.longitude,
    MECCA_LATITUDE,
    MECCA_LONGITUDE
  );

  return {
    direction: Math.round(bearing),
    directionName: bearingToDirectionName(bearing),
    meccaLatitude: MECCA_LATITUDE,
    meccaLongitude: MECCA_LONGITUDE,
  };
}

/**
 * Get Qibla direction using browser geolocation
 */
export async function getQiblaFromGeolocation(): Promise<QiblaDirection | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const qibla = calculateQibla({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        resolve(qibla);
      },
      () => {
        resolve(null);
      }
    );
  });
}

/**
 * Format bearing as compass direction
 */
export function formatBearing(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Get distance from location to Mecca (in km)
 */
export function getDistanceToMecca(
  location: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (MECCA_LATITUDE - location.latitude) * (Math.PI / 180);
  const dLon = (MECCA_LONGITUDE - location.longitude) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(location.latitude * (Math.PI / 180)) *
      Math.cos(MECCA_LATITUDE * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
