import React from "react";

export const LensType = {
  ConvexSquircle: 0,
  ConvexCircle: 1,
  ConcaveCircle: 2,
  ConcaveSquircle: 3,
  LipCircle: 4,
  LipSquircle: 5,
} as const;

export type LensType =
  (typeof LensType)[keyof typeof LensType];

export type SurfaceFn = (x: number) => number;

export interface GlassMaps {
  maxDisp: number;
  displacementMapUrl: string;
  specularUrl: string;
}

export interface GlassShapeConfig {
  width: number;
  height: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  surface?: LensType;
}

export interface LiquidGlassProps {
  /**
   * Lens profile geometry controlling the shape of the optical distortion.
   * Corresponds to a `LensType` enum value (0–5).
   * @default LensType.ConvexSquircle
   */
  lensType?: LensType;

  /**
   * Width of the glass container in pixels.
   * @default 100
   */
  width?: number;

  /**
   * Height of the glass container in pixels.
   * @default 100
   */
  height?: number;

  /**
   * Corner border-radius in pixels.
   * Defaults to ~50% of the smaller dimension, producing a fully-rounded
   * pill shape. Override to use a custom corner radius.
   * @default Math.round(Math.min(width, height) * 0.5)
   */
  radius?: number;

  /**
   * Blur applied to the captured backdrop before refraction, in CSS px
   * at 1x scale. Internally scaled by the actual capture resolution
   * (snapshotScale × device/mobile clamping) so the visual blur radius
   * stays consistent regardless of capture scale. 0 = off (current
   * crisp-refraction behavior).
   * @default 0
   */
  blur?: number;

  /**
   * Width of the refraction bezel/edge ring in pixels. Controls how deep
   * the optical distortion extends from the edge inward.
   * @default Math.round(Math.min(width, height) * 0.22)
   */
  bezelWidth?: number;

  /**
   * Simulated glass depth/thickness factor for light ray travel distance.
   * Larger values exaggerate the optical path and increase distortion.
   * @default Math.round(Math.min(width, height) * 1.1)
   */
  glassThickness?: number;

  /**
   * Index of refraction (IOR) used in Snell's Law calculations.
   * Real-world references: air ≈ 1.0, glass ≈ 1.5, diamond ≈ 2.4.
   * @default 1.5
   */
  refractiveIndex?: number;

  /**
   * Global multiplier on refraction intensity. Hover and press spring
   * physics also modulate this value transiently.
   * @default 1.0
   */
  refractionScale?: number;

  /**
   * Visual CSS scale transform applied to the glass mesh.
   * @default 1.0
   */
  scale?: number;

  /** Click handler attached to the glass container element. */
  onClick?: () => void;

  /** Additional CSS class names applied to the glass container `<div>`. */
  className?: string;

  /** Additional inline style overrides merged onto the glass container `<div>`. */
  style?: React.CSSProperties;

  /**
   * React nodes rendered inside the glass pane, layered above the WebGL
   * effect at `z-index: 20`.
   */
  children?: React.ReactNode;

  /**
   * Element containing the background behind the glass.
   *
   * Example:
   *
   * <div ref={backgroundRef}>
   *   <img src="/background.jpg" />
   *   <LiquidGlass />
   * </div>
   */
  backgroundRef: React.RefObject<HTMLElement | null>;

  /**
   * Capture resolution multiplier.
   *
   * 0.5 = half resolution
   * 1   = full resolution
   *
   * Applied to the *entire* backgroundRef element (scrollWidth x
   * scrollHeight), not just the panel — see the "Full-page backdrop
   * capture" note below. Automatically reduced if the resulting texture
   * would exceed the GPU's max texture size or (on iOS Safari) a lower
   * practical cap.
   * @default 1.0
   */
  snapshotScale?: number;

  /**
   * Minimum time between html2canvas captures.
   * @default 100
   */
  snapshotThrottle?: number;

  /**
   * Debounce delay (ms) before a resize-triggered recapture fires, for
   * both the panel's own ResizeObserver and the backgroundRef element's.
   * @default 250
   */
  resizeDebounce?: number;

  /**
   * Whether the glass responds to hover and press micro-interactions.
   * When `true`, spring physics drive transient bumps in `refractionScale`
   * and a subtle mesh scale change on hover/press.
   * @default true
   */
  isAnimated?: boolean;

  /**
   * Whether specular highlight goes around the lens or not
   * @default true
   */
  isSpecularDrift?: boolean;

  /**
   * Delay in milliseconds before the very first background snapshot is
   * taken, giving the page time to fully render and images to load.
   * @default 500
   */
  initialSnapshotDelay?: number;

  /**
   * Per-channel UV split at the bezel, as a fraction of the existing
   * refraction offset. 0 = off. ~0.15-0.4 reads as a glass edge fringe;
   * much higher looks like a broken lens.
   * @default 0
   */
  chromaticAberration?: number;
}
