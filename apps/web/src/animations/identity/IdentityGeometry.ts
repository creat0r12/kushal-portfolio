export interface IdentityRect {
  width: number;
  height: number;
  radius: number;
}

export interface IdentityPaths {
  source: string;
  target: string;
}

export function createNavbarIdentityPaths({
  width,
  height,
  radius,
}: IdentityRect): IdentityPaths {
  const safeRadius = Math.min(
    radius,
    width / 2,
    height / 2
  );

  const r = Math.max(
    8,
    Math.min(18, (safeRadius / height) * 100)
  );

  const left = 4;
  const right = 96;

  const top = 10;
  const bottom = 90;

  const center = 50;

  /*
   * SOURCE
   *
   * Visually this is ONLY:
   *
   * ─────────────────────────────
   *
   * The extra points exist only so the
   * browser can morph the same geometry
   * into the navbar.
   */
  const source = `
    M ${left} ${center}

    L ${left} ${center}

    Q ${left} ${center} ${left + r} ${center}

    L ${right - r} ${center}

    Q ${right} ${center} ${right} ${center}

    L ${right} ${center}

    Q ${right} ${center} ${right - r} ${center}

    L ${left + r} ${center}

    Q ${left} ${center} ${left} ${center}

    L ${left} ${center}
  `.trim();

  /*
   * TARGET
   *
   * The exact same point structure,
   * now adopting the navbar geometry.
   */
  const target = `
    M ${left} ${center}

    L ${left} ${top + r}

    Q ${left} ${top} ${left + r} ${top}

    L ${right - r} ${top}

    Q ${right} ${top} ${right} ${top + r}

    L ${right} ${bottom - r}

    Q ${right} ${bottom} ${right - r} ${bottom}

    L ${left + r} ${bottom}

    Q ${left} ${bottom} ${left} ${bottom - r}

    L ${left} ${center}
  `.trim();

  return {
    source,
    target,
  };
}