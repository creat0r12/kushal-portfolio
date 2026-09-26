import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 100%", "start 35%"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    mass: 0.8,
  });

  const y = useTransform(
    progress,
    [0, 0.45, 0.7, 1],
    [100, -7, 2, 0],
  );

  const scaleY = useTransform(
    progress,
    [0, 0.45, 0.7, 1],
    [0.78, 1.05, 0.985, 1],
  );

  const scaleX = useTransform(
    progress,
    [0, 0.45, 0.7, 1],
    [0.96, 1.015, 0.995, 1],
  );

  const opacity = useTransform(
    progress,
    [0, 0.25, 0.65, 1],
    [0, 0.75, 0.95, 1],
  );

  if (shouldReduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        y,
        scaleY,
        scaleX,
        opacity,
        transformOrigin: "center bottom",
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;