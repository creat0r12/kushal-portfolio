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

    vec3 worldPos =
      (modelMatrix * vec4(position, 1.0)).xyz;

    vViewDir =
      normalize(cameraPosition - worldPos);

    vNormal =
      normalize(normalMatrix * normal);

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

  uniform vec2 bgOffsetUv;
  uniform vec2 bgScaleUv;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;


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

    return
      length(max(q, 0.0)) +
      min(max(q.x, q.y), 0.0) -
      r;
  }


  /*
   |-------------------------------------------------------------------------- 
   | Main
   |-------------------------------------------------------------------------- 
   */

  void main() {

    /*
     |----------------------------------------------------------------------
     | Rounded rectangle
     |----------------------------------------------------------------------
     */

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
      1.0 -
      smoothstep(
        -1.0,
        1.0,
        distanceToEdge
      );

    if (shapeMask < 0.01) {
      discard;
    }


    /*
     |----------------------------------------------------------------------
     | Bezel
     |----------------------------------------------------------------------
     */

    float insideDistance =
      max(
        0.0,
        -distanceToEdge
      );

    float safeBezel =
      max(
        bezelWidth,
        0.001
      );

    float bezelMask =
      1.0 -
      smoothstep(
        0.0,
        safeBezel,
        insideDistance
      );

    float refractionStrength =
      pow(
        bezelMask,
        1.5
      );


    /*
     |----------------------------------------------------------------------
     | Animated displacement
     |----------------------------------------------------------------------
     */

    vec2 driftOffset =
      vec2(
        sin(elapsedTime * 0.15) * 0.05,
        elapsedTime * 0.05
      );

    vec2 displacementUv =
      clamp(
        vUv + driftOffset,
        0.001,
        0.999
      );

    vec2 displacement =
      texture2D(
        displacementMap,
        displacementUv
      ).rg;

    displacement =
      (displacement - 0.5) * 2.0;


    /*
     |----------------------------------------------------------------------
     | Refraction
     |----------------------------------------------------------------------
     */

    vec2 refractionOffset =
      displacement *
      refractionScale *
      0.06 *
      refractionStrength;

    /*
     * Keep the refraction from becoming excessive.
     */

    refractionOffset =
      clamp(
        refractionOffset,
        vec2(-0.15),
        vec2(0.15)
      );


    /*
     |----------------------------------------------------------------------
     | Chromatic aberration
     |----------------------------------------------------------------------
     */

    vec2 caOffset =
      refractionOffset *
      chromaticAberration;

    vec2 uvR =
      vUv +
      refractionOffset +
      caOffset;

    vec2 uvG =
      vUv +
      refractionOffset;

    vec2 uvB =
      vUv +
      refractionOffset -
      caOffset;

    uvR = clamp(uvR, 0.001, 0.999);
    uvG = clamp(uvG, 0.001, 0.999);
    uvB = clamp(uvB, 0.001, 0.999);


    /*
     |----------------------------------------------------------------------
     | Backdrop sampling
     |----------------------------------------------------------------------
     */

    vec2 bufferUvR =
      bgOffsetUv +
      uvR * bgScaleUv;

    vec2 bufferUvG =
      bgOffsetUv +
      uvG * bgScaleUv;

    vec2 bufferUvB =
      bgOffsetUv +
      uvB * bgScaleUv;

    bufferUvR =
      clamp(bufferUvR, 0.001, 0.999);

    bufferUvG =
      clamp(bufferUvG, 0.001, 0.999);

    bufferUvB =
      clamp(bufferUvB, 0.001, 0.999);


    float red =
      texture2D(
        backdropTexture,
        bufferUvR
      ).r;

    vec4 greenSample =
      texture2D(
        backdropTexture,
        bufferUvG
      );

    float blue =
      texture2D(
        backdropTexture,
        bufferUvB
      ).b;

    vec4 refracted =
      vec4(
        red,
        greenSample.g,
        blue,
        greenSample.a
      );


    /*
     |----------------------------------------------------------------------
     | Base glass
     |----------------------------------------------------------------------
     */

    vec4 specularSample =
      texture2D(
        specularMap,
        vUv
      );

    vec3 finalColor =
      refracted.rgb;

    finalColor +=
      specularSample.rgb *
      specularSample.a *
      0.35;


    /*
     |----------------------------------------------------------------------
     | Animated reflections
     |----------------------------------------------------------------------
     */

    if (specularDrift) {

      /*
       * Floating glints
       */

      vec2 lightPoint1 =
        vec2(
          sin(elapsedTime * 0.20),
          cos(elapsedTime * 0.30)
        ) *
        0.6 +
        0.5;

      vec2 lightPoint2 =
        vec2(
          sin(elapsedTime * -0.40 + 1.5),
          cos(elapsedTime * 0.25 - 0.5)
        ) *
        0.6 +
        0.5;

      float glint1 =
        smoothstep(
          0.4,
          0.0,
          distance(vUv, lightPoint1)
        ) *
        0.12;

      float glint2 =
        smoothstep(
          0.5,
          0.0,
          distance(vUv, lightPoint2)
        ) *
        0.08;


      /*
       * Moving diagonal reflection
       */

      float sweep =
        fract(elapsedTime * 0.30) *
        3.0 -
        0.5;

      float diagonal =
        vUv.x +
        (1.0 - vUv.y);

      float shine =
        1.0 -
        smoothstep(
          0.0,
          0.08,
          abs(diagonal - sweep)
        );

      shine *=
        bezelMask *
        0.15;


      finalColor +=
        vec3(
          glint1 +
          glint2 +
          shine
        );
    }


    /*
     |----------------------------------------------------------------------
     | Fresnel edge reflection
     |----------------------------------------------------------------------
     */

    vec3 normal =
      normalize(vNormal);

    vec3 viewDirection =
      normalize(vViewDir);

    float dotNV =
      clamp(
        dot(normal, viewDirection),
        0.0,
        1.0
      );

    float fresnel =
      pow(
        1.0 - dotNV,
        3.0
      );


    /*
     |----------------------------------------------------------------------
     | Very subtle neutral glass rim
     |----------------------------------------------------------------------
     */

    vec3 rimColor =
      vec3(
        0.85,
        0.90,
        1.0
      );

    finalColor +=
      rimColor *
      fresnel *
      bezelMask *
      0.12;


    /*
     |----------------------------------------------------------------------
     | Final output
     |----------------------------------------------------------------------
     */

    float alpha =
      shapeMask *
      clamp(
        entranceOpacity,
        0.0,
        1.0
      );

    gl_FragColor =
      vec4(
        finalColor,
        alpha
      );
  }
`;