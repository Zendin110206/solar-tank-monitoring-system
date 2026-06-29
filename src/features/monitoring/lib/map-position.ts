type CoordinatePoint = {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
};

type MapPosition = {
  left: string;
  top: string;
};

const MAP_PADDING_PERCENT = 12;
const MAP_RANGE_PERCENT = 100 - MAP_PADDING_PERCENT * 2;

function isFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasCoordinate(
  point: CoordinatePoint,
): point is CoordinatePoint & { latitude: number; longitude: number } {
  return (
    isFiniteCoordinate(point.latitude) && isFiniteCoordinate(point.longitude)
  );
}

function formatPositionPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

function normalizeCoordinate(value: number, min: number, max: number): number {
  if (max === min) {
    return 0.5;
  }

  return (value - min) / (max - min);
}

export function buildMapPositionsFromCoordinates(
  points: CoordinatePoint[],
): Record<string, MapPosition> {
  const validPoints = points.filter(hasCoordinate);

  if (validPoints.length === 0) {
    return {};
  }

  const latitudes = validPoints.map((point) => point.latitude);
  const longitudes = validPoints.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return Object.fromEntries(
    validPoints.map((point) => {
      const x = normalizeCoordinate(
        point.longitude,
        minLongitude,
        maxLongitude,
      );
      const y = 1 - normalizeCoordinate(point.latitude, minLatitude, maxLatitude);

      return [
        point.id,
        {
          left: formatPositionPercent(
            MAP_PADDING_PERCENT + x * MAP_RANGE_PERCENT,
          ),
          top: formatPositionPercent(
            MAP_PADDING_PERCENT + y * MAP_RANGE_PERCENT,
          ),
        },
      ];
    }),
  );
}
