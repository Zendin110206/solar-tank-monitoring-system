import { clamp } from "@/lib/math";

// Hitungan ubin peta (proyeksi Web Mercator) yang sama di peta operasional dan peta ringkas.
// Batas lintang, tinggi peta, dan zoom tiap peta tetap diatur di komponen petanya.

export const TILE_SIZE = 256;

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type WorldPixel = {
  x: number;
  y: number;
};

export type Tile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

export type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startCenterPixel: WorldPixel;
};

export function getWorldSize(zoom: number) {
  return TILE_SIZE * 2 ** zoom;
}

export function wrapTileX(tileX: number, tilesPerAxis: number) {
  return ((tileX % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
}

export function worldPixelToLatLng(pixel: WorldPixel, zoom: number): LatLng {
  const worldSize = getWorldSize(zoom);
  const normalizedX = pixel.x / worldSize - 0.5;
  const normalizedY = 0.5 - pixel.y / worldSize;
  const longitude = normalizedX * 360;
  const latitude =
    90 - (360 * Math.atan(Math.exp(-normalizedY * 2 * Math.PI))) / Math.PI;

  return {
    latitude: clamp(latitude, -85, 85),
    longitude: ((longitude + 540) % 360) - 180,
  };
}
