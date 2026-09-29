/**
 * Core refraction math and glass physics
 */

import { LensType } from "./types";
import type { GlassMaps, GlassShapeConfig, SurfaceFn } from "./types";

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

function smootherstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return Math.pow(t, 3) * (t * (t * 6 - 15) + 10);
}

const SurfaceEquations: Record<LensType, SurfaceFn> = {
  [LensType.ConvexSquircle]: (x: number) =>
    Math.pow(1 - Math.pow(1 - x, 4), 1 / 4),
  [LensType.ConvexCircle]: (x: number) => Math.sqrt(1 - Math.pow(1 - x, 2)),
  [LensType.ConcaveCircle]: (x: number) =>
    1 - SurfaceEquations[LensType.ConvexCircle](x),
  [LensType.ConcaveSquircle]: (x: number) =>
    1 - SurfaceEquations[LensType.ConvexSquircle](x),
  [LensType.LipCircle]: (x: number) =>
    mix(
      SurfaceEquations[LensType.ConvexCircle](x),
      SurfaceEquations[LensType.ConcaveCircle](x),
      smootherstep(x),
    ),
  [LensType.LipSquircle]: (x: number) =>
    mix(
      SurfaceEquations[LensType.ConvexSquircle](x),
      SurfaceEquations[LensType.ConcaveSquircle](x),
      smootherstep(x),
    ),
};

// New: per-family corner metric + its outward direction
function cornerDistance(
  x: number,
  y: number,
  squircle: boolean,
  n = 4,
): number {
  if (!squircle) return Math.sqrt(x * x + y * y);
  return Math.pow(Math.pow(Math.abs(x), n) + Math.pow(Math.abs(y), n), 1 / n);
}

function cornerDirection(
  x: number,
  y: number,
  squircle: boolean,
  n = 4,
): [number, number] {
  if (!squircle) {
    const d = Math.sqrt(x * x + y * y);
    return d > 0 ? [x / d, y / d] : [0, 0];
  }
  // Gradient of |x|^n + |y|^n, normalized — the true outward normal of
  // the superellipse level set. Not the same as the naive x/dist, y/dist
  // radial direction once n != 2, and using the radial direction here
  // would push displacement toward the wrong corner shape.
  const gx = n * Math.pow(Math.abs(x), n - 1) * Math.sign(x);
  const gy = n * Math.pow(Math.abs(y), n - 1) * Math.sign(y);
  const g = Math.sqrt(gx * gx + gy * gy);
  return g > 0 ? [gx / g, gy / g] : [0, 0];
}

const isSquircle = (t: LensType): boolean =>
  t === LensType.ConvexSquircle ||
  t === LensType.ConcaveSquircle ||
  t === LensType.LipSquircle;

/**
 * Computes the 1D refraction displacement profile across a glass bezel,
 * using Snell's law against the chosen surface curve (e.g. a squircle lens).
 */
function calculateDisplacementMap1D(
  glassThickness: number,
  bezelWidth: number,
  surfaceFn: SurfaceFn,
  refractiveIndex: number,
  samples = 128,
): number[] {
  const eta = 1 / refractiveIndex;
  const result: number[] = [];

  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = surfaceFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const slope = (surfaceFn(Math.max(0, Math.min(1, x + dx))) - y) / dx;
    const mag = Math.sqrt(slope * slope + 1);
    const normal: [number, number] = [-slope / mag, -1 / mag];
    const cosTheta = normal[1];
    const k = 1 - eta * eta * (1 - cosTheta * cosTheta);

    if (k < 0) {
      result.push(0);
    } else {
      const refracted: [number, number] = [
        -(eta * cosTheta + Math.sqrt(k)) * normal[0],
        eta - (eta * cosTheta + Math.sqrt(k)) * normal[1],
      ];
      result.push(
        refracted[0] * ((y * bezelWidth + glassThickness) / refracted[1]),
      );
    }
  }
  return result;
}

/**
 * Paints the 1D profile radially around a rounded-rect shape into an
 * ImageData displacement map (R = x-offset, G = y-offset), centered at 128.
 */
function calculateDisplacementMap2D(
  canvasWidth: number,
  canvasHeight: number,
  objectWidth: number,
  objectHeight: number,
  radius: number,
  bezelWidth: number,
  maxDisp: number,
  profile: number[],
  squircle: boolean,
): ImageData {
  const img = new ImageData(canvasWidth, canvasHeight);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 128;
    img.data[i + 1] = 128;
    img.data[i + 3] = 255;
  }

  const rp1 = radius + 1;
  const rmBw = Math.max(0, radius - bezelWidth);
  const wB = objectWidth - radius * 2;
  const hB = objectHeight - radius * 2;
  const oX = (canvasWidth - objectWidth) / 2;
  const oY = (canvasHeight - objectHeight) / 2;

  for (let y1 = 0; y1 < objectHeight; y1++) {
    for (let x1 = 0; x1 < objectWidth; x1++) {
      const idx = ((oY + y1) * canvasWidth + oX + x1) * 4;
      const x =
        x1 < radius
          ? x1 - radius
          : x1 >= objectWidth - radius
            ? x1 - radius - wB
            : 0;
      const y =
        y1 < radius
          ? y1 - radius
          : y1 >= objectHeight - radius
            ? y1 - radius - hB
            : 0;

      const dist = cornerDistance(x, y, squircle);

      if (dist <= rp1 && dist >= rmBw) {
        const op = dist < radius ? 1 : 1 - (dist - radius) / (rp1 - radius);
        const bIdx = Math.floor(
          Math.max(0, Math.min(1, (radius - dist) / bezelWidth)) *
            profile.length,
        );
        const dVal =
          profile[Math.max(0, Math.min(bIdx, profile.length - 1))] || 0;
        const [dirX, dirY] = cornerDirection(x, y, squircle);
        const dX = maxDisp > 0 ? (-dirX * dVal) / maxDisp : 0;
        const dY = maxDisp > 0 ? (-dirY * dVal) / maxDisp : 0;

        img.data[idx] = Math.max(0, Math.min(255, 128 + dX * 127 * op));
        img.data[idx + 1] = Math.max(0, Math.min(255, 128 + dY * 127 * op));
      }
    }
  }
  return img;
}

/**
 * Computes a soft directional specular-highlight ring along the bezel.
 */
function calculateSpecularHighlight(
  objectWidth: number,
  objectHeight: number,
  radius: number,
  squircle: boolean,
): ImageData {
  const img = new ImageData(objectWidth, objectHeight);
  const lightVec: [number, number] = [
    Math.cos(Math.PI / 3),
    Math.sin(Math.PI / 3),
  ];
  const rp1 = radius + 1;
  const rmS = Math.max(0, radius - 1.5);

  for (let y1 = 0; y1 < objectHeight; y1++) {
    for (let x1 = 0; x1 < objectWidth; x1++) {
      const x =
        x1 < radius
          ? x1 - radius
          : x1 >= objectWidth - radius
            ? x1 - radius - (objectWidth - radius * 2)
            : 0;
      const y =
        y1 < radius
          ? y1 - radius
          : y1 >= objectHeight - radius
            ? y1 - radius - (objectHeight - radius * 2)
            : 0;

      const dist = cornerDistance(x, y, squircle);

      if (dist <= rp1 && dist >= rmS) {
        const op = dist < radius ? 1 : 1 - (dist - radius) / (rp1 - radius);
        const [dirX, dirY] = cornerDirection(x, y, squircle);
        const dp = Math.abs(dirX * lightVec[0] + -dirY * lightVec[1]);
        const cf =
          dp *
          Math.sqrt(
            1 - (1 - Math.max(0, Math.min(1, (radius - dist) / 1.5))) ** 2,
          );
        const c = Math.min(255, 255 * cf);
        const idx = (y1 * objectWidth + x1) * 4;

        img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = c;
        img.data[idx + 3] = Math.min(255, c * cf * op);
      }
    }
  }
  return img;
}

export function imageDataToDataURL(img: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/**
 * Runs the full pipeline (1D profile -> 2D map -> specular -> data URLs) for one shape.
 */
export function buildGlassMaps(config: GlassShapeConfig): GlassMaps {
  const surface = config.surface ?? LensType.ConvexSquircle;
  const squircle = isSquircle(surface);

  const profile = calculateDisplacementMap1D(
    config.glassThickness,
    config.bezelWidth,
    SurfaceEquations[surface],
    config.refractiveIndex,
  );
  const maxDisp = Math.max(...profile.map(Math.abs)) || 1;

  const dispImg = calculateDisplacementMap2D(
    config.width,
    config.height,
    config.width,
    config.height,
    config.radius,
    config.bezelWidth,
    maxDisp,
    profile,
    squircle,
  );
  const specImg = calculateSpecularHighlight(
    config.width,
    config.height,
    config.radius,
    squircle,
  );

  return {
    maxDisp,
    displacementMapUrl: imageDataToDataURL(dispImg),
    specularUrl: imageDataToDataURL(specImg),
  };
}
