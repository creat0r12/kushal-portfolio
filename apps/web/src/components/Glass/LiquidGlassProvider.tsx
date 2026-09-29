"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { prefersReducedMotion, supportsWebGL } from "./utils";

interface LensRegistration {
  mesh: THREE.Mesh;
  onFrame: (dt: number) => void;
}

interface LiquidGlassRendererBundle {
  ready: boolean;
  fallback: boolean;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.OrthographicCamera | null;
  registerLens: (id: string, reg: LensRegistration) => () => void;
  onReady: Array<() => void>;
}

const LiquidGlassRendererContext =
  createContext<LiquidGlassRendererBundle | null>(null);

/**
 * Consumed by <LiquidGlass> to get at the shared renderer/scene/camera
 * and to register/unregister itself. Throws if used outside the
 * provider — every <LiquidGlass> instance needs one ancestor
 * <LiquidGlassRendererProvider>, not one renderer each.
 */
export function useLiquidGlass(): LiquidGlassRendererBundle {
  const bundle = useContext(LiquidGlassRendererContext);
  if (!bundle) {
    throw new Error(
      "LiquidGlass must be rendered inside a <LiquidGlassProvider>.",
    );
  }
  return bundle;
}

/**
 * Owns the ONE WebGLRenderer / canvas / scene / camera shared by every
 * <LiquidGlass> instance under it. Mount this once near the root of
 * whatever page/layout uses LiquidGlass panels.
 *
 * Why this exists: each LiquidGlass instance used to create its own
 * WebGLRenderer bound to its own <canvas>. That doesn't scale — 10
 * panels means 10 GL contexts (browsers cap concurrent contexts around
 * 8-16, so a 10th+ panel can silently evict an older one's context),
 * 10 independent render loops, and GPU context-switch overhead on every
 * draw call. With this provider there's one context, one canvas
 * covering the viewport, and one render() call per frame — each panel
 * just contributes a mesh + a per-frame callback (for its own spring
 * physics and uniform updates) to a shared registry.
 *
 * The canvas is a fixed, full-viewport, pointer-events:none overlay.
 * Because the fragment shader already discards pixels outside the
 * lens's rounded-rect SDF (see the `shapeMask` discard in
 * LiquidGlassThreeOptimized's fragment shader), a single big canvas
 * can safely host many independently-shaped lenses without needing
 * per-lens DOM clipping — each mesh only ever paints inside its own
 * shape regardless of where else on the shared canvas it sits.
 *
 * Known scope cuts (flagged, not solved here):
 * - Stacking order between the glass and *other* page content above it
 *   uses one fixed z-index for the whole shared canvas, not the
 *   dynamic per-lens effective-z-index trick the vanilla liquidGL.js
 *   reference uses. Fine for a page where nothing needs to render
 *   between two different lenses' DOM stacking positions; revisit if
 *   that's ever not true.
 * - Backdrop capture (html2canvas) is still one call per unique
 *   backgroundRef, done independently by each LiquidGlass instance —
 *   this provider doesn't deduplicate captures across lenses that
 *   happen to share the same backgroundRef.
 */
export function LiquidGlassProvider({
  children,
  canvasZIndex = 10,
}: {
  children: ReactNode;
  /** CSS z-index of the shared canvas relative to other page content. */
  canvasZIndex?: number;
}) {
  // A stable, always-defined object passed as context value from the
  // very first render — never gated behind state. This sidesteps the
  // child-effects-run-before-parent-effects ordering problem: a
  // <LiquidGlass> child's mount effect can run before this provider's
  // own setup effect has created the renderer, but since it's reading
  // fields off this same stable object (not a value swapped in later),
  // it can safely queue itself via `onReady` and the provider's effect
  // will flush that queue once setup finishes, in the same commit.
  const bundleRef = useRef<LiquidGlassRendererBundle>({
    ready: false,
    fallback: false,
    renderer: null,
    scene: null,
    camera: null,
    onReady: [],
    registerLens: () => () => {},
  });

  useEffect(() => {
    const bundle = bundleRef.current;

    if (!supportsWebGL() || prefersReducedMotion()) {
      bundle.fallback = true;
      bundle.ready = true;
      const pending = bundle.onReady.splice(0, bundle.onReady.length);
      pending.forEach((cb) => cb());
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.setAttribute("data-liquid-ignore", "");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: String(canvasZIndex),
    });
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      precision: "highp",
    });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // Orthographic camera in plain screen-pixel space, origin top-left,
    // +y down — deliberately matching getBoundingClientRect() so each
    // lens can set mesh.position straight from its own container's
    // live rect with no coordinate conversion.
    const camera = new THREE.OrthographicCamera(
      0,
      document.documentElement.clientWidth,
      0,
      document.documentElement.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 100;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      renderer.setSize(width, height, false);
      camera.right = width;
      camera.bottom = height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const registry = new Map<string, LensRegistration>();
    let rafId: number;
    let lastTime = performance.now();

    function frame() {
      rafId = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      registry.forEach((reg) => reg.onFrame(dt));

      renderer.render(scene, camera);
    }
    frame();

    function registerLens(id: string, reg: LensRegistration) {
      registry.set(id, reg);
      scene.add(reg.mesh);
      return () => {
        registry.delete(id);
        scene.remove(reg.mesh);
      };
    }

    bundle.renderer = renderer;
    bundle.scene = scene;
    bundle.camera = camera;
    bundle.registerLens = registerLens;
    bundle.ready = true;

    // Flush anything that registered before this effect ran.
    const pending = bundle.onReady.splice(0, bundle.onReady.length);
    pending.forEach((cb) => cb());

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      canvas.remove();
      bundle.ready = false;
      bundle.renderer = null;
      bundle.scene = null;
      bundle.camera = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasZIndex]);

  return (
    <LiquidGlassRendererContext.Provider value={bundleRef.current}>
      {children}
    </LiquidGlassRendererContext.Provider>
  );
}
