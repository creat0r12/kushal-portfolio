import {
  createNavbarIdentityPaths,
  type IdentityRect,
} from "./IdentityGeometry";

export function getIdentityTarget(
  element: HTMLElement
): IdentityRect {
  const rect = element.getBoundingClientRect();

  const styles = window.getComputedStyle(element);

  const radius =
    parseFloat(styles.borderTopLeftRadius) || 0;

  return {
    width: rect.width,
    height: rect.height,
    radius,
  };
}

export function getNavbarIdentityPaths(
  element: HTMLElement
) {
  const geometry = getIdentityTarget(element);

  return createNavbarIdentityPaths(geometry);
}