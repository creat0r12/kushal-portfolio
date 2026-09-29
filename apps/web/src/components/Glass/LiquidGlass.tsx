"use client";

import html2canvas from "html2canvas-pro";
import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { buildGlassMaps } from "./engine";
import { useLiquidGlass } from "./LiquidGlassProvider";
import { fragmentShader, vertexShader } from "./shaders";
import { LensType } from "./types";
import type { LiquidGlassProps } from "./types";
import { createSpring, debounce } from "./utils";

let lensZCounter = 0;

function LiquidGlass({
  lensType = LensType.ConvexSquircle,
  width = 100,
  height = 100,
  radius = Math.round(Math.min(width, height) * 0.5),
  scale = 1,
  blur = 0,
  bezelWidth = Math.round(Math.min(width, height) * 0.22),
  glassThickness = Math.round(Math.min(width, height) * 1.1),
  refractiveIndex = 1.5,
  refractionScale = 1,
  onClick,
  className,
  style,
  children,
  backgroundRef,
  snapshotScale = 1,
  snapshotThrottle = 100,
  resizeDebounce = 250,
  chromaticAberration = 0,
  isAnimated = true,
  isSpecularDrift = true,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cursorRef = useRef({
    x: 0.5,
    y: 0.5,
    active: false,
  });
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const backdropTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotContextRef = useRef<CanvasRenderingContext2D | null>(null);

  const isCapturingRef = useRef(false);
  const snapshotRequestedRef = useRef(false);
  const hasCapturedOnceRef = { current: false };
  const lastSnapshotTimeRef = useRef(0);

  // Full CSS-px size (pre-devicePixelRatio, pre-snapshotScale) of the
  // last captured backgroundRef element. Used every animation frame to
  // convert the panel's live getBoundingClientRect() into UV bounds —
  // see "Full-page backdrop capture" note below.
  const bgSizeRef = useRef({ w: 1, h: 1 });

  // Read live in onFrame rather than made an effect dependencies — `scale` and `blur`
  // changing shouldn't tear down and rebuild the mesh/material/capture
  // pipeline, just change a multiplier the next frame reads.
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const blurRef = useRef(blur);
  blurRef.current = blur;

  const elapsedTimeRef = useRef(0);

  // Stable per-instance mesh depth, assigned once on mount, so later-
  // mounted lenses paint on top of earlier ones by default when two
  // happen to overlap on the shared canvas. Not a substitute for real
  // DOM stacking-order parity — see LiquidGlassRenderer's scope-cut
  // note — just a reasonable default.
  const [meshZ] = useState(() => -++lensZCounter * 0.01);

  const instanceId = useId();

  // Deliberately NOT destructured: `gl` is a stable object whose fields
  // (renderer/scene/ready/registerLens) get filled in by the provider's
  // own effect, which may run after this component's effects already
  // started (children mount before parents in React's effect order).
  // Destructuring `gl.renderer` or `gl.registerLens` here would freeze
  // in whatever value existed at render time — often the not-ready
  // placeholder. Reading `gl.xxx` fresh at the point of use, inside the
  // effect below, is what makes the onReady queue in
  // LiquidGlassProvider actually work.
  const gl = useLiquidGlass();

  const [maps, setMaps] = useState<{
    displacementMapUrl: string;
    specularUrl: string;
    maxDisp: number;
  } | null>(null);

  useEffect(() => {
    const newMaps = buildGlassMaps({
      width,
      height,
      radius,
      bezelWidth,
      glassThickness,
      refractiveIndex,
      surface: lensType,
    });

    setMaps(newMaps);
  }, [
    width,
    height,
    radius,
    bezelWidth,
    glassThickness,
    refractiveIndex,
    lensType,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Setup — deferred against the shared renderer via gl.onReady
  |--------------------------------------------------------------------------
  |
  | Everything that touches the shared renderer/scene lives inside
  | setup(). Because a child's mount effect can run before the
  | LiquidGlassRendererProvider's own setup effect (React runs child
  | effects before parent effects), we can't assume gl.renderer/gl.scene
  | are populated yet the first time this effect body runs. If gl.ready
  | is already true, run setup() immediately; otherwise queue it via
  | gl.onReady, which the provider flushes the moment it finishes its
  | own setup — same commit, no dropped frame, no polling.
  |
  */
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !maps) {
      return;
    }

    const container = containerRef.current;
    let cancelled = false;
    let cleanupImpl: (() => void) | null = null;

    function setup() {
      if (cancelled) return;

      if (gl.fallback) {
        setIsFallback(true);
        return;
      }

      const sharedRenderer = gl.renderer;
      const sharedScene = gl.scene;
      if (!sharedRenderer || !sharedScene || !maps) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Snapshot Canvas
      |--------------------------------------------------------------------------
      |
      | Placeholder size — the real dimensions (full document scrollWidth /
      | scrollHeight, scaled) are only known once captureBackground() runs,
      | since we're capturing the *whole* backgroundRef element rather than
      | a viewport- or panel-sized region. See "Full-page backdrop capture"
      | note on captureBackground below for why.
      |
      */

      const snapshotCanvas = document.createElement("canvas");
      snapshotCanvas.width = 1;
      snapshotCanvas.height = 1;
      snapshotCanvasRef.current = snapshotCanvas;

      const snapshotContext = snapshotCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
        colorSpace: "srgb",
      });

      snapshotContextRef.current = snapshotContext;

      if (snapshotContext) {
        snapshotContext.fillStyle = "rgba(255, 255, 255, 0)";
        snapshotContext.fillRect(0, 0, 1, 1);
      }

      /*
      |--------------------------------------------------------------------------
      | Backdrop Texture
      |--------------------------------------------------------------------------
      |
      | configureBackdropTexture applies the fixed set of texture params to
      | any CanvasTexture we create for this panel. We need this as a
      | reusable function, not just one-time setup, because captureBackground
      | recreates the texture object whenever the captured document size
      | changes — see the note there for why reusing one CanvasTexture
      | across different canvas dimensions causes a GL upload failure.
      |
      */

      const configureBackdropTexture = (tex: THREE.CanvasTexture) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        return tex;
      };

      const backdropTexture = configureBackdropTexture(
        new THREE.CanvasTexture(snapshotCanvas),
      );

      backdropTextureRef.current = backdropTexture;

      // Tracks the pixel dimensions the *currently assigned* backdropTexture
      // object was allocated for, so captureBackground knows whether a
      // needsUpdate refresh is safe or whether it must recreate the texture.
      const backdropTextureSizeRef = { current: { w: 1, h: 1 } };

      /*
      |--------------------------------------------------------------------------
      | Create Texture From Image
      |--------------------------------------------------------------------------
      */

      const createTextureFromImage = (
        imageSrc: string,
        onLoad: (texture: THREE.Texture) => void,
      ) => {
        const image = new Image();

        image.crossOrigin = "anonymous";

        image.onload = () => {
          const imageCanvas = document.createElement("canvas");

          imageCanvas.width = width;

          imageCanvas.height = height;

          const ctx = imageCanvas.getContext("2d");

          if (!ctx) {
            return;
          }

          ctx.drawImage(image, 0, 0, width, height);

          const texture = new THREE.CanvasTexture(imageCanvas);

          texture.minFilter = THREE.LinearFilter;

          texture.magFilter = THREE.LinearFilter;

          onLoad(texture);
        };

        image.src = imageSrc;
      };

      /*
      |--------------------------------------------------------------------------
      | Load Displacement Map
      |--------------------------------------------------------------------------
      */

      createTextureFromImage(maps.displacementMapUrl, (texture) => {
        if (materialRef.current) {
          materialRef.current.uniforms.displacementMap.value = texture;
        }
      });

      /*
      |--------------------------------------------------------------------------
      | Load Specular Map
      |--------------------------------------------------------------------------
      */

      createTextureFromImage(maps.specularUrl, (texture) => {
        if (materialRef.current) {
          materialRef.current.uniforms.specularMap.value = texture;
        }
      });

      /*
      |--------------------------------------------------------------------------
      | Material
      |--------------------------------------------------------------------------
      */

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,

        uniforms: {
          displacementMap: {
            value: new THREE.Texture(),
          },

          specularMap: {
            value: new THREE.Texture(),
          },

          backdropTexture: {
            value: backdropTexture,
          },

          refractionScale: {
            value: refractionScale,
          },

          maxDisp: {
            value: maps.maxDisp,
          },

          resolution: {
            value: new THREE.Vector2(width, height),
          },

          radius: {
            value: radius,
          },

          width: {
            value: width,
          },

          height: {
            value: height,
          },

          refractiveIndex: {
            value: refractiveIndex,
          },

          bezelWidth: {
            value: bezelWidth,
          },

          bgOffsetUv: {
            value: new THREE.Vector2(0, 0),
          },

          bgScaleUv: {
            value: new THREE.Vector2(1, 1),
          },

          chromaticAberration: {
            value: chromaticAberration,
          },

          entranceOpacity: {
            value: 0,
          },

          elapsedTime: {
            value: 0,
          },

          specularDrift: {
            value: isSpecularDrift,
          },
        },

        transparent: true,

        side: THREE.DoubleSide,

        depthWrite: false,
      });

      materialRef.current = material;

      /*
      |--------------------------------------------------------------------------
      | Geometry + Mesh
      |--------------------------------------------------------------------------
      |
      | This mesh is added to the SHARED scene (via gl.registerLens
      | below), not a scene this component owns. Its on-screen position
      | is set every frame in updateBackdropBounds() from this panel's
      | own container.getBoundingClientRect() — the shared camera is in
      | plain page-pixel space (see LiquidGlassRenderer), so that rect
      | can be used directly with no conversion.
      |
      */

      const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = meshZ;

      /*
      |--------------------------------------------------------------------------
      | Hover / Press Physics
      |--------------------------------------------------------------------------
      |
      | Two independent springs, each targeting 0 or 1 depending on pointer
      | state. Values are read every shared-loop frame (see onFrame below)
      | to drive: a refraction "pulse" (both hover and press push
      | refractionScale up — press pushes harder) and a mesh scale change
      | (press compresses slightly, hover lifts slightly).
      |
      | pointerup is bound on window, not the container, so a press that's
      | released after the cursor has moved off the panel still resolves
      | (otherwise it would stay "stuck" pressed).
      |
      */

      const hoverSpring = createSpring(170, 20);
      const pressSpring = createSpring(320, 24);
      const onPointerEnter = () => {
        hoverSpring.target = 1;
        cursorRef.current.active = true;
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();

        cursorRef.current.x =
          (event.clientX - rect.left) / rect.width;

        cursorRef.current.y =
          (event.clientY - rect.top) / rect.height;

        cursorRef.current.active = true;
      };

      const onPointerLeave = () => {
        hoverSpring.target = 0;
        pressSpring.target = 0;
        cursorRef.current.active = false;
      };

      const onPointerDown = () => {
        pressSpring.target = 1;
      };

      const onPointerUp = () => {
        pressSpring.target = 0;
      };

      if (isAnimated) {
        container.addEventListener("pointerenter", onPointerEnter, {
          passive: true,
        });

        container.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });

        container.addEventListener("pointerleave", onPointerLeave, {
          passive: true,
        });
        container.addEventListener("pointerdown", onPointerDown, {
          passive: true,
        });
        window.addEventListener("pointerup", onPointerUp, { passive: true });
      }

      /*
      |--------------------------------------------------------------------------
      | Snapshot Capture — full-page backdrop capture
      |--------------------------------------------------------------------------
      |
      | We capture the ENTIRE backgroundRef element (scrollWidth x
      | scrollHeight, scrollX:0/scrollY:0 — i.e. document-space, not
      | viewport-space) rather than a viewport- or panel-sized region.
      |
      | Position tracking happens every shared-loop frame in
      | updateBackdropBounds() below, by diffing two live
      | getBoundingClientRect() calls — cheap, and correct for fixed,
      | sticky, and in-flow panels alike with no special-casing.
      |
      | Recapture is only needed when the *content* actually changes —
      | resize of the panel or of the background — never on scroll, and
      | (now that DPR/sizing belong to the shared canvas, not this
      | component) never on DPR change either.
      |
      */

      const captureBackground = async () => {
        const background = backgroundRef?.current;

        const snapshotContext = snapshotContextRef.current;

        if (!background || !container || !snapshotContext) {
          return;
        }

        if (isCapturingRef.current) {
          return;
        }

        const now = performance.now();

        if (now - lastSnapshotTimeRef.current < snapshotThrottle) {
          return;
        }

        isCapturingRef.current = true;
        lastSnapshotTimeRef.current = now;

        try {
          const fullW = background.scrollWidth;
          const fullH = background.scrollHeight;

          const maxTex = sharedRenderer.capabilities.maxTextureSize || 8192;
          const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const MAX_MOBILE_DIM = 4096;

          let effectiveScale = Math.min(
            snapshotScale,
            maxTex / fullW,
            maxTex / fullH,
          );

          if (isMobileSafari) {
            const over =
              (Math.max(fullW, fullH) * effectiveScale) / MAX_MOBILE_DIM;
            if (over > 1) effectiveScale = effectiveScale / over;
          }

          effectiveScale = Math.max(0.05, effectiveScale);

          const scaledWidth = Math.max(1, Math.round(fullW * effectiveScale));
          const scaledHeight = Math.max(1, Math.round(fullH * effectiveScale));
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
          const snapshot = await html2canvas(background, {
            width: fullW,
            height: fullH,

            // Document-space, not viewport-space — we want the whole
            // scrollable element regardless of current scroll position.
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.clientWidth,
            windowHeight: document.documentElement.clientHeight,

            scale: effectiveScale,

            backgroundColor: null,

            logging: false,

            useCORS: true,

            allowTaint: true,

            removeContainer: true,

            imageTimeout: 5000,

            onclone: (clonedDocument) => {
              const ignoredElements = clonedDocument.querySelectorAll(
                "[data-liquid-ignore]",
              );
              ignoredElements.forEach((el) => {
                (el as HTMLElement).style.visibility = "hidden";
              });
            },
          });

          const canvasEl = snapshotCanvasRef.current;
          if (!canvasEl) return;

          const dimensionsChanged =
            backdropTextureSizeRef.current.w !== scaledWidth ||
            backdropTextureSizeRef.current.h !== scaledHeight;

          if (
            canvasEl.width !== scaledWidth ||
            canvasEl.height !== scaledHeight
          ) {
            canvasEl.width = scaledWidth;
            canvasEl.height = scaledHeight;
          }

          snapshotContext.clearRect(0, 0, scaledWidth, scaledHeight);

          // Blur scales with effectiveScale so a given blurAmount reads as the
          // same physical softness regardless of snapshotScale or the mobile/
          // max-texture clamping above — a fixed px value here would look
          // different (and wrong) at 0.5x capture scale vs 1x.
          const scaledBlur = blurRef.current * effectiveScale;
          snapshotContext.filter =
            scaledBlur > 0 ? `blur(${scaledBlur}px)` : "none";

          snapshotContext.drawImage(snapshot, 0, 0, scaledWidth, scaledHeight);

          snapshotContext.filter = "none"; // Reset for any future drawImage calls (e.g. if we ever add a debug overlay)

          // Record the CSS-px size this capture represents; used every
          // frame in updateBackdropBounds() to convert live rects to UV.
          bgSizeRef.current = { w: fullW, h: fullH };

          if (!hasCapturedOnceRef.current) {
            hasCapturedOnceRef.current = true;
          }

          if (dimensionsChanged) {
            // Resizing a canvas already wrapped by a THREE.CanvasTexture and
            // then calling needsUpdate does not reliably reallocate GPU
            // storage — Three/ANGLE can take a partial-upload path sized for
            // the texture's original dimensions, which fails silently as
            // "GL_INVALID_VALUE: glCopySubTextureCHROMIUM: Offset overflows
            // texture dimensions" (visible in the console as a warning, not
            // an error — nothing throws, the texture just never gets real
            // pixels). Recreating the texture object forces a full, correctly
            // sized allocation.
            const oldTexture = backdropTextureRef.current;

            const newTexture = configureBackdropTexture(
              new THREE.CanvasTexture(canvasEl),
            );

            backdropTextureRef.current = newTexture;
            backdropTextureSizeRef.current = {
              w: scaledWidth,
              h: scaledHeight,
            };

            if (materialRef.current) {
              materialRef.current.uniforms.backdropTexture.value = newTexture;
            }

            oldTexture?.dispose();
          } else {
            backdropTextureRef.current!.needsUpdate = true;
          }

          // No manual render() call here — the shared loop in
          // LiquidGlassRenderer renders continuously every frame, so the
          // next frame naturally picks up the refreshed texture.
        } catch (error) {
          console.error("[LiquidGlass] Failed to capture background:", error);
        } finally {
          isCapturingRef.current = false;
        }
      };

      /*
      |--------------------------------------------------------------------------
      | Deduplicated Snapshot Request
      |--------------------------------------------------------------------------
      */

      const requestSnapshot = () => {
        if (snapshotRequestedRef.current) {
          return;
        }

        snapshotRequestedRef.current = true;

        requestAnimationFrame(() => {
          snapshotRequestedRef.current = false;

          captureBackground();
        });
      };

      /*
      |--------------------------------------------------------------------------
      | Per-Frame Backdrop Bounds + Mesh Position
      |--------------------------------------------------------------------------
      |
      | Converts the panel's live position into (a) UV bounds within the
      | full-page backdrop texture and (b) this mesh's on-screen position
      | on the shared canvas. Two getBoundingClientRect() reads; both
      | viewport-relative, so their difference is scroll-invariant and
      | correct for fixed, sticky, and in-flow panels without needing to
      | know which one it is. Called every shared-loop frame via onFrame.
      |
      */

      const updateBackdropBounds = () => {
        const background = backgroundRef?.current;
        const mat = materialRef.current;

        if (!background || !mat) {
          return;
        }

        const glassRect = container.getBoundingClientRect();
        const bgRect = background.getBoundingClientRect();
        const { w: fullW, h: fullH } = bgSizeRef.current;

        // Shared camera is in plain page-pixel space (see
        // LiquidGlassRenderer) — this panel's on-screen position on the
        // shared canvas is just its own live rect center.
        mesh.position.x = glassRect.left + glassRect.width / 2;
        mesh.position.y = glassRect.top + glassRect.height / 2;

        const docX = glassRect.left - bgRect.left;

        // getBoundingClientRect() is top-down (y increases toward the
        // bottom of the page); CanvasTexture's default flipY=true makes
        // texture v increase upward (v=1 at the top of the captured
        // document). Converting here — anchored at the panel's *bottom*
        // edge — lets the shader combine bgOffsetUv with refractedUv.y via
        // a plain multiply-add, since refractedUv.y already agrees with
        // texture-v direction (both "up" = increasing, from
        // PlaneGeometry's default UV layout).
        const docYBottom = glassRect.top - bgRect.top + height;
        const offsetV = 1 - docYBottom / fullH;

        mat.uniforms.bgOffsetUv.value.set(docX / fullW, offsetV);
        mat.uniforms.bgScaleUv.value.set(width / fullW, height / fullH);
      };

      /*
      |--------------------------------------------------------------------------
      | Recapture on Resize (panel or background), debounced
      |--------------------------------------------------------------------------
      |
      | Scroll never lands here — only genuine content/layout changes do.
      | Both observers share one debounced handler; either firing is a
      | reason the whole document may need re-rasterizing.
      |
      */

      const onResize = debounce(() => {
        if (isCapturingRef.current) return;
        requestSnapshot();
      }, resizeDebounce);

      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);

      const background = backgroundRef?.current;
      if (background && "ResizeObserver" in window) {
        resizeObserver.observe(background);
      }

      window.addEventListener("resize", onResize, { passive: true });

      /*
      |--------------------------------------------------------------------------
      | Register with the shared render loop
      |--------------------------------------------------------------------------
      |
      | onFrame runs inside LiquidGlassRenderer's single rAF loop,
      | alongside every other registered lens's onFrame — no per-instance
      | requestAnimationFrame call, and no renderer.render() call here;
      | the provider renders once per frame after every lens's onFrame
      | has run.
      |
      */

      function onFrame(dt: number) {
        hoverSpring.update(dt);
        pressSpring.update(dt);
        

        const hoverAmount = hoverSpring.value;
        const pressAmount = pressSpring.value;

        if (isSpecularDrift) {
          elapsedTimeRef.current += dt;
          material.uniforms.elapsedTime.value = elapsedTimeRef.current;
        }
        material.uniforms.entranceOpacity.value = 1;
        material.uniforms.refractionScale.value =
          refractionScale * (1 + hoverAmount * 0.25 + pressAmount * 0.6);
        material.uniforms.chromaticAberration.value = chromaticAberration;

        const pressScale = 1 - pressAmount * 0.04;
        const hoverScale = 1 + hoverAmount * 0.015;
        const userScale = scaleRef.current;
        const baseScale = pressScale * hoverScale * userScale;
        mesh.scale.set(
          baseScale,
          -baseScale, // Flip Y to counteract the OrthographicCamera's Y inversion
          1,
        );

        updateBackdropBounds();
      }

      const unregister = gl.registerLens(instanceId, { mesh, onFrame });

      // Wait a bit for the page to fully render and images to load
      // before the first capture.
      const initialSnapshotTimeout = setTimeout(() => {
        requestSnapshot();

        requestAnimationFrame(() => {
          requestSnapshot();
        });

        setTimeout(() => {
          requestSnapshot();
        }, 800);
      }, 300);

      cleanupImpl = () => {
        clearTimeout(initialSnapshotTimeout);

        window.removeEventListener("resize", onResize);

        if (isAnimated) {
          container.removeEventListener("pointerenter", onPointerEnter);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerleave", onPointerLeave);
          container.removeEventListener("pointerdown", onPointerDown);
          window.removeEventListener("pointerup", onPointerUp);
        }

        resizeObserver.disconnect();

        unregister();

        geometry.dispose();
        material.dispose();
        backdropTextureRef.current?.dispose();
      };
    }

    if (gl.ready) {
      setup();
    } else {
      gl.onReady.push(setup);
    }

    return () => {
      cancelled = true;
      cleanupImpl?.();

      const idx = gl.onReady.indexOf(setup);
      if (idx !== -1) gl.onReady.splice(idx, 1);
    };
  }, [
    width,
    height,
    radius,
    refractionScale,
    refractiveIndex,
    bezelWidth,
    chromaticAberration,
    backgroundRef,
    snapshotScale,
    snapshotThrottle,
    resizeDebounce,

    maps,
    gl,
    instanceId,
    meshZ,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  |
  | No <canvas> here — the visual lives on the shared canvas owned by
  | LiquidGlassRendererProvider. This div exists for layout (defines the
  | rect the shared mesh tracks every frame), pointer events (hover/press
  | listeners attach to it), and slotting `children` on top of the glass.
  |
  */

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        position: "relative",

        width,

        height,

        borderRadius: radius,

        cursor: onClick ? "pointer" : undefined,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        overflow: "hidden",

        // Fallback blur for browsers that don't support WebGL or users who prefer reduced motion. The shared canvas is invisible in those cases, so we need a CSS fallback.
        backdropFilter: isFallback ? `blur(${blurRef.current}px)` : undefined,
        WebkitBackdropFilter: isFallback
          ? `blur(${blurRef.current}px)`
          : undefined,
        backgroundColor: isFallback ? "rgba(255, 255, 255, 0.1)" : undefined,

        ...style,
      }}
      className={className}
      data-liquid-ignore
    >
      <div
        style={{
          position: "relative",

          zIndex: 20,

          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default LiquidGlass;
