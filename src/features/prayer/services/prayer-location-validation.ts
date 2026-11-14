export function parsePrayerCoordinate(
  value: unknown,
  min: number,
  max: number,
): number | null {
  let numeric: number;

  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
      return null;
    }
    numeric = Number(normalized);
  } else {
    return null;
  }

  return Number.isFinite(numeric) && numeric >= min && numeric <= max
    ? numeric
    : null;
}
