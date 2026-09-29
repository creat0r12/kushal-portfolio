import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import "./LiquidMorph.css";

type LiquidMorphProps = {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
  style?: CSSProperties;
};

function LiquidMorph({
  children,
  width = 400,
  height = 300,
  radius = 28,
  className = "",
  style,
}: LiquidMorphProps) {
  const id = useId();

  const filterId = `glass-distortion-${id.replace(/:/g, "")}`;

  return (
    <>
      {/* SVG distortion filter */}
      <svg
        width="0"
        height="0"
        style={{
          position: "absolute",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
  type="fractalNoise"
  baseFrequency="0.012 0.012"
  numOctaves="2"
  seed="92"
  result="noise"
>
  <animate
    attributeName="baseFrequency"
    values="
      0.012 0.012;
      0.018 0.014;
      0.012 0.018;
      0.008 0.012;
      0.012 0.012
    "
    dur="8s"
    repeatCount="indefinite"
  />
</feTurbulence>

            <feGaussianBlur
              in="noise"
              stdDeviation="2"
              result="blurred"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale="85"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`liquid-glass-card ${className}`}
        style={{
          width,
          height,
          borderRadius: radius,
          ...style,
        }}
      >
        {/* Backdrop distortion */}
        <div
          className="liquid-glass-card__distortion"
          style={{
            borderRadius: radius,
            filter: `url(#${filterId})`,
            WebkitFilter: `url(#${filterId})`,
          }}
        />

        {/* Inner edge */}
        <div
          className="liquid-glass-card__inner"
          style={{
            borderRadius: radius,
          }}
        />

        {/* Content */}
        <div className="liquid-glass-card__content">
          {children}
        </div>
      </div>
    </>
  );
}

export default LiquidMorph;