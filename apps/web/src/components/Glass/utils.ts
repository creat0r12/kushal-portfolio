/**
 * A single scalar critically-underdamped spring (mass = 1). Call
 * `update(dt)` once per frame with dt in seconds; read `.value`.
 * Interruptible by design: retargeting mid-motion just changes the
 * force term next frame, preserving current value/velocity — no need
 * to cancel or restart a fixed-duration animation.
 *
 * stiffness: higher = snappier, reaches target faster.
 * damping: higher = less overshoot/oscillation; roughly critically
 * damped around damping = 2 * sqrt(stiffness).
 */
export function createSpring(stiffness: number, damping: number) {
  return {
    value: 0,
    velocity: 0,
    target: 0,
    stiffness,
    damping,
    update(dt: number) {
      const force = -this.stiffness * (this.value - this.target);
      const dampingForce = -this.damping * this.velocity;
      const accel = force + dampingForce;
      this.velocity += accel * dt;
      this.value += this.velocity * dt;
    },
  };
}

export function debounce<F extends (...args: never[]) => void>(
  fn: F,
  wait: number,
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
