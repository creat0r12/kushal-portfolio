/*
  |--------------------------------------------------------------------------
  | Vertex Shader
  |--------------------------------------------------------------------------
  */

export const vertexShader = `
    varying vec2 vUv;
    varying vec2 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;
 
    void main() {
      vUv = uv;
      vPosition = position.xy;
 
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
 
      vViewDir = normalize(worldPos - cameraPosition);
 
      vNormal = normalize(normalMatrix * normal);
 
      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
    }
  `;

/*
  |--------------------------------------------------------------------------
  | Fragment Shader
  |--------------------------------------------------------------------------
  */

export const fragmentShader = `
    uniform sampler2D displacementMap;
    uniform sampler2D specularMap;
    uniform sampler2D backdropTexture;

    uniform float refractionScale;
    uniform float chromaticAberration;
    uniform float maxDisp;

    uniform vec2 resolution;

    uniform float radius;
    uniform float width;
    uniform float height;
    uniform float bezelWidth;
    uniform float entranceOpacity;

    uniform bool specularDrift;
    uniform float elapsedTime;

    // Where this panel's rect currently sits within the full-page backdrop
    // texture, in UV space. Recomputed every frame from live
    // getBoundingClientRect() calls (see updateBackdropBounds), so scroll
    // (and layout shifts generally) are tracked for free — no recapture,
    // no buffer, nothing that can run out mid-scroll.
    uniform vec2 bgOffsetUv;
    uniform vec2 bgScaleUv;

    varying vec2 vUv;

    /*
    |--------------------------------------------------------------------------
    | Rounded Box SDF
    |--------------------------------------------------------------------------
    */

    float roundedBoxSDF(
      vec2 p,
      vec2 b,
      float r
    ) {
      vec2 q = abs(p) - b + r;

      return length(max(q, 0.0))
        + min(max(q.x, q.y), 0.0)
        - r;
    }

    /*
    |--------------------------------------------------------------------------
    | Main
    |--------------------------------------------------------------------------
    */

    void main() {

      // --------------------------------------------------
      // Rounded rectangle geometry
      // --------------------------------------------------

      vec2 p =
        (vUv - 0.5) *
        vec2(width, height);

      vec2 halfSize =
        vec2(width, height) * 0.5;

      float distanceToEdge =
        roundedBoxSDF(
          p,
          halfSize,
          radius
        );

      float shapeMask =
        1.0 - smoothstep(
          -1.0,
          1.0,
          distanceToEdge
        );

      if (shapeMask < 0.01) {
        discard;
      }

      // --------------------------------------------------
      // Distance from the inner edge
      // --------------------------------------------------

      float insideDistance =
        max(
          0.0,
          -distanceToEdge
        );

      // --------------------------------------------------
      // Bezel falloff
      //
      // edge   = 1
      // center = 0
      // --------------------------------------------------

      float bezelMask =
        1.0 - smoothstep(
          0.0,
          bezelWidth,
          insideDistance
        );

      float refractionStrength =
        pow(
          bezelMask,
          1.5
        );

      // --------------------------------------------------
      // Optical displacement
      // --------------------------------------------------

      vec2 displacement =
        texture2D(
          displacementMap,
          vUv
        ).rg;

      displacement =
        (displacement - 0.5) * 2.0;

      // --------------------------------------------------
      // Refraction
      // --------------------------------------------------

      vec2 refractionOffset =
        displacement *
        refractionScale *
        0.06 *
        refractionStrength;

      // Push R outward, B inward, G at the base offset — the standard
      // three-tap CA split. Scaled by chromaticAberration as a fraction of
      // the existing offset, so it disappears at 0 and grows with the same
      // bezelMask falloff the refraction already uses (no separate mask
      // needed — fringing should only ever show where refraction does).
      vec2 caOffset = refractionOffset * chromaticAberration;

      vec2 uvR = vUv + refractionOffset + caOffset;
      vec2 uvG = vUv + refractionOffset;
      vec2 uvB = vUv + refractionOffset - caOffset;

      vec2 bufferUvR = bgOffsetUv + uvR * bgScaleUv;
      vec2 bufferUvG = bgOffsetUv + uvG * bgScaleUv;
      vec2 bufferUvB = bgOffsetUv + uvB * bgScaleUv;

      float r = texture2D(backdropTexture, bufferUvR).r;
      vec4 gSample = texture2D(backdropTexture, bufferUvG);
      float b = texture2D(backdropTexture, bufferUvB).b;

      // Alpha/shape comes from the G tap — CA shouldn't perturb the panel's
      // own edge mask, only the color sampled inside it.
      vec4 refracted = vec4(r, gSample.g, b, gSample.a);

      // --------------------------------------------------
      // Specular
      // --------------------------------------------------

      vec4 specularSample =
        texture2D(
          specularMap,
          vUv
        );

      // --------------------------------------------------
      // Final
      // --------------------------------------------------

      vec3 finalColor =
  refracted.rgb;

// Existing glass reflection
finalColor +=
  specularSample.rgb *
  specularSample.a *
  0.35;


// --------------------------------------------------
// Continuous moving glass reflection
// --------------------------------------------------

float lineX =
  fract(elapsedTime * 0.05) * 1.4 - 0.2;

// Diagonal position across the whole glass
float linePosition =
  vUv.x +
  vUv.y * 0.35;

// Main moving reflection
float movingLine =
  1.0 -
  smoothstep(
    0.0,
    0.055,
    abs(linePosition - lineX)
  );

// Soft light surrounding the reflection
float softReflection =
  1.0 -
  smoothstep(
    0.0,
    0.16,
    abs(linePosition - lineX)
  );

// Combine sharp highlight + soft glass reflection
float glassReflection =
  movingLine * 0.55 +
  softReflection * 0.45;

// Subtle neutral-white reflection
finalColor +=
  vec3(0.88, 0.92, 1.0) *
  glassReflection *
  0.10;

      // --------------------------------------------------
      // Animated specular glints
      // --------------------------------------------------

      if (specularDrift) {
        vec2 lp1 = vec2(sin(elapsedTime * 0.2), cos(elapsedTime * 0.3)) * 0.6 + 0.5;
        vec2 lp2 = vec2(sin(elapsedTime * -0.4 + 1.5), cos(elapsedTime * 0.25 - 0.5)) * 0.6 + 0.5;

        float glint = 0.0;
        glint += smoothstep(0.4, 0.0, distance(vUv, lp1)) * 0.1;
        glint += smoothstep(0.5, 0.0, distance(vUv, lp2)) * 0.08;

        finalColor += glint;
      }

     

      gl_FragColor =
        vec4(
          finalColor,
          shapeMask * entranceOpacity
        );
    }
  `;
