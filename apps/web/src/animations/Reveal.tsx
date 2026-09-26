import {
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/*
==================================================
GLOBAL ANIMATION CONFIGURATION
==================================================

Change these values to control the animation
for the entire website.
*/

const animationConfig = {
  duration: 0.7,

  y: 28,

  scale: 0.985,

  blur: 2,

  ease: [0.22, 1, 0.36, 1] as const,
};


/*
==================================================
ANIMATION VARIANTS
==================================================
*/

const variants: Variants = {
  hidden: {
    opacity: 0,
    y: animationConfig.y,
    scale: animationConfig.scale,
    filter: `blur(${animationConfig.blur}px)`,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
};


/*
==================================================
REVEAL COMPONENT
==================================================
*/

function Reveal({
  children,
  className = "",
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`reveal-section ${className}`}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: animationConfig.duration,
        ease: animationConfig.ease,
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;