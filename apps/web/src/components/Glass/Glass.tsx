import type { ReactNode } from "react";
import type { CSSProperties, RefObject } from "react";

import LiquidGlass from "./LiquidGlass";
import { LensType } from "./types";

type GlassProps = {
  children: ReactNode;

  width?: number;
  height?: number;
  radius?: number;

  backgroundRef: RefObject<HTMLElement | null>;

  lensType?: LensType;
  refractionScale?: number;
  refractiveIndex?: number;
  bezelWidth?: number;
  glassThickness?: number;
  chromaticAberration?: number;

  className?: string;
  style?: CSSProperties;
};

function Glass({
  children,

  width = 300,
  height = 200,
  radius = 28,

  backgroundRef,

  lensType = LensType.ConvexSquircle,
  refractionScale = 1,
  refractiveIndex = 1.5,
  bezelWidth = 35,
  glassThickness = 120,
  chromaticAberration = 0,

  className,
  style,
}: GlassProps) {
  return (
    <LiquidGlass
      width={width}
      height={height}
      radius={radius}
      lensType={lensType}
      refractionScale={refractionScale}
      refractiveIndex={refractiveIndex}
      bezelWidth={bezelWidth}
      glassThickness={glassThickness}
      chromaticAberration={chromaticAberration}
      backgroundRef={backgroundRef}
      className={className}
      style={style}
    >
      {children}
    </LiquidGlass>
  );
}

export default Glass;