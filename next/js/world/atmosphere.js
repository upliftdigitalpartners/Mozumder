/* =========================================================
   Atmosphere — one sky model shared by the sky dome, the
   fog on every material and the reflection environment, so
   the horizon never shows a seam between sea, land and sky.
   ========================================================= */
import * as THREE from 'three';

/* Shared uniform objects. Every patched material holds a reference to
   these same objects, so updating .value here updates the whole world. */
export const atmo = {
  uSunDir:     { value: new THREE.Vector3(0, 0.1, -1).normalize() },
  uZenith:     { value: new THREE.Color() },
  uHorizon:    { value: new THREE.Color() },
  uHorizonSun: { value: new THREE.Color() },
  uSunColor:   { value: new THREE.Color() },
  uNight:      { value: 0 },
  uTime:       { value: 0 },
};

export const ATMO_GLSL = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uHorizonSun;
uniform vec3 uSunColor;
uniform float uNight;
uniform float uTime;

vec3 atmoColor( vec3 dir ) {
  vec3 dirH = normalize( vec3( dir.x, 0.0, dir.z ) + 1e-5 );
  vec3 sunH = normalize( vec3( uSunDir.x, 0.0, uSunDir.z ) + 1e-5 );
  float az  = max( dot( dirH, sunH ), 0.0 );
  vec3 hor  = mix( uHorizon, uHorizonSun, pow( az, 2.5 ) * ( 1.0 - uNight * 0.6 ) );
  float h   = clamp( dir.y, 0.0, 1.0 );
  vec3 col  = mix( hor, uZenith, pow( h, 0.42 ) );
  col = mix( col, hor * 0.82, clamp( -dir.y * 3.0, 0.0, 1.0 ) );
  float sd = max( dot( dir, uSunDir ), 0.0 );
  col += uSunColor * ( pow( sd, 6.0 ) * 0.28 + pow( sd, 48.0 ) * 0.55 ) * ( 1.0 - uNight * 0.85 );
  return col;
}
`;

/* ---------- Global fog chunk patch ----------
   Fog colour is taken from the sky in the fragment's view direction
   (aerial perspective) instead of a flat colour. */
let chunksPatched = false;
export function patchFogChunks() {
  if (chunksPatched) return;
  chunksPatched = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = `#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogView;
#endif`;
  C.fog_vertex = `#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogView = mvPosition.xyz;
#endif`;
  C.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogView;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  ${ATMO_GLSL}
#endif`;
  C.fog_fragment = `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  vec3 fogDirW = normalize( ( vec4( vFogView, 0.0 ) * viewMatrix ).xyz );
  // Thinner fog when looking up through less air.
  fogFactor *= mix( 1.0, 0.35, clamp( fogDirW.y * 2.0, 0.0, 1.0 ) );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, atmoColor( fogDirW ), fogFactor );
#endif`;
}

/* Attach the shared uniforms to every material in a scene. Safe to call
   more than once; existing onBeforeCompile hooks are preserved. */
export function bindAtmosphere(root) {
  root.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(bindMaterial);
  });
}
export function bindMaterial(m) {
  if (m.userData.atmoBound) return;
  m.userData.atmoBound = true;
  if (m.isShaderMaterial) {
    Object.assign(m.uniforms, atmo);
    return;
  }
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = function (shader, renderer) {
    Object.assign(shader.uniforms, atmo);
    if (prev) prev.call(this, shader, renderer);
  };
}

/* ---------- Time-of-day palette ----------
   Keyed on sun elevation in degrees. Values are linear-space targets. */
const PALETTE = [
  // elev, zenith,    horizon,   horizonSun, sunColor,  sunLight,  hemiSky,   hemiGround
  [ 14, '#2f5d96', '#a9c3d9', '#f3d3a8', '#fff1d6', '#fff0dc', '#9fc0e0', '#4a4436'],
  [  6, '#2a4d86', '#d6a77e', '#ffb067', '#ffcf8a', '#ffc58a', '#8aa6cc', '#4a3a2c'],
  [  2, '#1f3770', '#c98463', '#ff8a3d', '#ff9e52', '#ff9a55', '#6f7fae', '#3a2b26'],
  [ -2, '#152655', '#7a5a78', '#e2683d', '#ff7240', '#c27a6a', '#4b5688', '#221c24'],
  [ -6, '#0b1638', '#2d3157', '#6a3d4a', '#8a4a40', '#5a6a9a', '#27335e', '#121420'],
  [-12, '#040a1c', '#0d1733', '#1a1f3c', '#2a2a40', '#4a5f96', '#1a2547', '#0a0c14'],
].map(r => ({
  e: r[0],
  zenith: new THREE.Color(r[1]), horizon: new THREE.Color(r[2]), horizonSun: new THREE.Color(r[3]),
  sun: new THREE.Color(r[4]), light: new THREE.Color(r[5]),
  hemiSky: new THREE.Color(r[6]), hemiGround: new THREE.Color(r[7]),
}));

const _c = new THREE.Color();
function samplePalette(elev, key, out) {
  if (elev >= PALETTE[0].e) return out.copy(PALETTE[0][key]);
  for (let i = 0; i < PALETTE.length - 1; i++) {
    const a = PALETTE[i], b = PALETTE[i + 1];
    if (elev <= a.e && elev >= b.e) {
      const t = (a.e - elev) / (a.e - b.e);
      return out.copy(a[key]).lerp(_c.copy(b[key]), t);
    }
  }
  return out.copy(PALETTE[PALETTE.length - 1][key]);
}

export const SUN_AZIMUTH = THREE.MathUtils.degToRad(-100); // sun sits west, a little south

/* Update every atmosphere value from a sun elevation (degrees).
   Returns derived values the engine uses for lights and exposure. */
export function setTimeOfDay(elevDeg, out) {
  const el = THREE.MathUtils.degToRad(Math.max(elevDeg, -12));
  const d = atmo.uSunDir.value;
  d.set(Math.cos(el) * Math.sin(SUN_AZIMUTH), Math.sin(el), Math.cos(el) * Math.cos(SUN_AZIMUTH)).normalize();
  samplePalette(elevDeg, 'zenith', atmo.uZenith.value);
  samplePalette(elevDeg, 'horizon', atmo.uHorizon.value);
  samplePalette(elevDeg, 'horizonSun', atmo.uHorizonSun.value);
  samplePalette(elevDeg, 'sun', atmo.uSunColor.value);
  const night = THREE.MathUtils.smoothstep(-elevDeg, -3, 8);  // 0 at +3°, 1 at -8°
  atmo.uNight.value = night;
  out.night = night;
  out.dusk = THREE.MathUtils.smoothstep(-elevDeg, -8, 1);     // lamps start before full dark
  samplePalette(elevDeg, 'light', out.lightColor);
  samplePalette(elevDeg, 'hemiSky', out.hemiSky);
  samplePalette(elevDeg, 'hemiGround', out.hemiGround);
  return out;
}

/* ---------- Sky dome ---------- */
export function createSky() {
  const geo = new THREE.SphereGeometry(1, 64, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { ...atmo, uClouds: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize( position );
        vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        gl_Position = p.xyww;   // pin to the far plane
      }`,
    fragmentShader: /* glsl */`
      ${ATMO_GLSL}
      uniform float uClouds;
      varying vec3 vDir;

      float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
      float noise( vec2 p ) {
        vec2 i = floor( p ), f = fract( p );
        vec2 u = f * f * ( 3.0 - 2.0 * f );
        return mix( mix( hash( i ), hash( i + vec2( 1, 0 ) ), u.x ),
                    mix( hash( i + vec2( 0, 1 ) ), hash( i + vec2( 1, 1 ) ), u.x ), u.y );
      }
      float fbm( vec2 p ) {
        float v = 0.0, a = 0.5;
        for ( int i = 0; i < 5; i++ ) { v += a * noise( p ); p = p * 2.03 + 17.1; a *= 0.5; }
        return v;
      }

      void main() {
        vec3 dir = normalize( vDir );
        vec3 col = atmoColor( dir );
        float sd = max( dot( dir, uSunDir ), 0.0 );

        // Sun disc, kept HDR so bloom picks it up.
        float disc = smoothstep( 0.99965, 0.99985, sd );
        col += uSunColor * disc * 22.0 * ( 1.0 - uNight );

        // Stars at night.
        if ( dir.y > 0.0 ) {
          vec2 sp = dir.xz / ( dir.y + 0.35 ) * 180.0;
          vec2 cell = floor( sp );
          float h = hash( cell );
          float star = step( 0.9965, h ) * smoothstep( 0.5, 0.0, length( fract( sp ) - 0.5 ) );
          float tw = 0.6 + 0.4 * sin( uTime * 2.0 + h * 80.0 );
          col += vec3( 0.85, 0.9, 1.0 ) * star * tw * uNight * 2.2 * smoothstep( 0.0, 0.25, dir.y );
        }

        // Cloud layer: a plane high above, lit by the low sun.
        if ( dir.y > 0.0 && uClouds > 0.0 ) {
          vec2 cp = dir.xz / ( dir.y + 0.08 ) * 0.9 + vec2( uTime * 0.004, uTime * 0.0015 );
          float n = fbm( cp * 1.6 );
          float cov = smoothstep( 0.48, 0.78, n );
          float thick = smoothstep( 0.5, 0.95, n );
          vec3 lit = mix( uHorizonSun * 1.15, uSunColor * 1.6, pow( sd, 4.0 ) );
          vec3 shade = mix( uZenith * 0.7, uHorizon * 0.55, 0.5 );
          vec3 ccol = mix( lit, shade, thick * 0.75 );
          ccol = mix( ccol, vec3( 0.06, 0.08, 0.14 ) + uHorizon * 0.25, uNight * 0.85 );
          float fade = smoothstep( 0.0, 0.18, dir.y );
          col = mix( col, ccol, cov * fade * 0.85 * uClouds );
        }
        gl_FragColor = vec4( col, 1.0 );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(9000);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.userData.atmoBound = true;
  return mesh;
}
