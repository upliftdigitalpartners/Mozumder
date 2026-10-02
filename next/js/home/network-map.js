/* =========================================================
   Mozumder — 3D network map of Bangladesh (Three.js)
   A holographic country outline with the four operating hubs,
   animated freight lanes between them and the 64 districts.
   The page drives it with setProgress(0..1) and setActive().
   ========================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* Simplified national outline, clockwise from the Panchagarh tip (lon, lat). */
const OUTLINE = [
  [88.45, 26.60], [88.70, 26.35], [89.05, 26.30], [89.35, 26.10], [89.55, 26.00], [89.85, 25.95],
  [89.85, 25.30], [90.10, 25.24], [90.60, 25.18], [91.20, 25.20], [91.65, 25.15], [92.05, 25.18],
  [92.45, 24.95], [92.25, 24.55], [92.10, 24.25], [91.85, 24.15], [91.60, 24.08], [91.35, 24.10],
  [91.25, 23.85], [91.15, 23.55], [91.20, 23.20], [91.38, 22.95], [91.60, 23.05], [91.80, 23.55],
  [92.05, 23.68], [92.28, 23.68], [92.32, 23.20], [92.45, 22.70], [92.58, 22.15], [92.62, 21.60],
  [92.40, 21.38], [92.30, 20.95], [92.30, 20.74], [92.05, 21.15], [91.97, 21.48], [91.85, 21.85],
  [91.80, 22.25], [91.65, 22.50], [91.45, 22.70], [91.20, 22.75], [90.95, 22.62], [90.75, 22.30],
  [90.55, 22.05], [90.30, 21.85], [89.95, 21.90], [89.60, 21.75], [89.20, 21.65], [88.95, 21.75],
  [89.05, 22.15], [88.95, 22.55], [88.95, 23.05], [88.70, 23.60], [88.60, 24.05], [88.15, 24.45],
  [88.05, 24.70], [88.30, 25.00], [88.45, 25.20], [88.55, 25.45], [88.20, 25.75], [88.10, 26.00],
  [88.15, 26.35],
];
const RIVERS = [
  [[89.70, 25.90], [89.72, 25.20], [89.68, 24.50], [89.75, 23.85]],                 // Jamuna
  [[88.30, 24.45], [88.95, 24.15], [89.40, 23.95], [89.75, 23.85], [90.45, 23.35]], // Padma
  [[91.05, 24.30], [90.80, 23.80], [90.60, 23.30], [90.65, 22.80], [90.72, 22.40]], // Meghna
];
export const HUBS = [
  { id: 'ctg', name: 'Chattogram', note: 'HQ · Port operations', lon: 91.82, lat: 22.34, hq: true },
  { id: 'dhk', name: 'Dhaka', note: 'Corporate supply & distribution', lon: 90.41, lat: 23.81 },
  { id: 'syl', name: 'Sylhet', note: 'Regional hub', lon: 91.87, lat: 24.89 },
  { id: 'khl', name: 'Khulna', note: 'Regional hub', lon: 89.56, lat: 22.82 },
];
const LANES = [['ctg', 'dhk'], ['dhk', 'syl'], ['dhk', 'khl'], ['ctg', 'syl'], ['ctg', 'khl']];

const NAVY = new THREE.Color('#0a1f4d');
const GOLD = new THREE.Color('#f4a83c');
const CYAN = new THREE.Color('#7fd3ff');

const K = 24;                      // world units per degree
const LON0 = 90.3, LAT0 = 23.65;
const COS = Math.cos(THREE.MathUtils.degToRad(LAT0));
function project(lon, lat) { return new THREE.Vector2((lon - LON0) * K * COS, -(lat - LAT0) * K); }

function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (((a.y > pt.y) !== (b.y > pt.y)) && (pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x)) c = !c;
  }
  return c;
}

export function createNetworkMap(canvas, opts = {}) {
  const still = !!opts.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor('#040a1a', 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#040a1a', 0.0042);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 2000);

  const group = new THREE.Group();          // whole map, tilted toward the viewer
  scene.add(group);

  /* ---- background stars (match the drone shot it fades in from) ---- */
  {
    const rnd = mulberry(7), n = 1400, pos = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 300 + rnd() * 500, th = rnd() * Math.PI * 2, ph = Math.acos(rnd() * 1.6 - 0.6);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      sz[i] = 0.6 + rnd() * 1.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float size; varying float vTw; uniform float uTime;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
          vTw = 0.65 + 0.35 * sin(uTime * 1.3 + position.x * 0.07 + position.y * 0.11);
          gl_PointSize = size * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vTw;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          gl_FragColor = vec4(vec3(0.8, 0.88, 1.0) * vTw, smoothstep(0.5, 0.0, d)); }`,
    });
    scene.add(new THREE.Points(g, m));
    scene.userData.stars = m;
  }

  const poly = OUTLINE.map(([lo, la]) => project(lo, la));
  const shape = new THREE.Shape(poly);

  /* ---- landmass: thin extruded slab ---- */
  const slab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false, curveSegments: 1 }),
    new THREE.MeshBasicMaterial({ color: NAVY.clone().multiplyScalar(0.55), transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  // +90° maps shape (x, y) to world (x, 0, y), matching project(); depth runs downward.
  slab.rotation.x = Math.PI / 2;
  group.add(slab);

  /* ---- top surface: dot grid, hub ripples ---- */
  const hubPts = HUBS.map(h => project(h.lon, h.lat));
  const topMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uHubs: { value: hubPts.map(p => new THREE.Vector2(p.x, p.y)) },
      uReveal: { value: 0 },
      uGold: { value: GOLD }, uCyan: { value: CYAN },
    },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime, uReveal; uniform vec2 uHubs[4]; uniform vec3 uGold, uCyan; varying vec2 vP;
      void main(){
        vec2 g = fract(vP / 2.2) - 0.5;
        float dot = smoothstep(0.16, 0.05, length(g));
        float rip = 0.0;
        for (int i = 0; i < 4; i++) {
          float d = length(vP - uHubs[i]);
          float k = ( fract( d / 34.0 - uTime * 0.18 ) - 0.5 ) * 34.0;
          rip += exp( -k * k * 0.7 ) * exp( -d * 0.035 );
        }
        float sweep = smoothstep(0.0, 1.0, uReveal * 170.0 - (vP.y + 80.0));
        vec3 col = uCyan * dot * 0.32 + uGold * rip * 0.55 + vec3(0.03, 0.07, 0.16);
        gl_FragColor = vec4(col, (0.55 + dot * 0.45) * sweep);
      }`,
  });
  const top = new THREE.Mesh(new THREE.ShapeGeometry(shape, 1), topMat);
  top.rotation.x = Math.PI / 2;
  top.position.y = 0.02;
  group.add(top);

  /* ---- glowing border ---- */
  const border3 = poly.map(p => new THREE.Vector3(p.x, 0.15, p.y));
  const borderCurve = new THREE.CatmullRomCurve3(border3, true, 'centripetal', 0.2);
  const borderMat = new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(2.2), toneMapped: false });
  const border = new THREE.Mesh(new THREE.TubeGeometry(borderCurve, 600, 0.32, 6, true), borderMat);
  group.add(border);
  // soft halo under the border
  group.add(new THREE.Mesh(new THREE.TubeGeometry(borderCurve, 600, 1.4, 6, true),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending })));

  /* ---- rivers ---- */
  RIVERS.forEach(r => {
    const c = new THREE.CatmullRomCurve3(r.map(([lo, la]) => { const p = project(lo, la); return new THREE.Vector3(p.x, 0.08, p.y); }));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.18, 4, false),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.35, depthWrite: false })));
  });

  /* ---- 64 district points ---- */
  const districts = [];
  {
    const rnd = mulberry(64);
    const minX = Math.min(...poly.map(p => p.x)), maxX = Math.max(...poly.map(p => p.x));
    const minY = Math.min(...poly.map(p => p.y)), maxY = Math.max(...poly.map(p => p.y));
    let guard = 0;
    while (districts.length < 64 && guard++ < 20000) {
      const p = new THREE.Vector2(minX + rnd() * (maxX - minX), minY + rnd() * (maxY - minY));
      if (!inside(p, poly)) continue;
      if (districts.some(d => d.distanceTo(p) < 5.2)) continue;
      districts.push(p);
    }
    const g = new THREE.BufferGeometry().setFromPoints(districts.map(d => new THREE.Vector3(d.x, 0.4, d.y)));
    const m = new THREE.PointsMaterial({ color: CYAN.clone().multiplyScalar(1.6), size: 1.3, sizeAttenuation: true, transparent: true, opacity: 0.9, toneMapped: false });
    group.add(new THREE.Points(g, m));
  }

  /* ---- hubs: core, beam, pulse rings ---- */
  const hubObjs = {};
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: GOLD }, uTime: { value: 0 } },
    vertexShader: `varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uTime; varying float vY;
      void main(){ float a = pow(1.0 - vY, 2.2) * (0.75 + 0.25 * sin(uTime * 3.0 - vY * 12.0));
        gl_FragColor = vec4(uColor * 1.8, a * 0.75); }`,
  });
  HUBS.forEach(h => {
    const p = project(h.lon, h.lat);
    const o = new THREE.Group();
    o.position.set(p.x, 0, p.y);
    const s = h.hq ? 1.5 : 1;
    o.add(new THREE.Mesh(new THREE.SphereGeometry(1.1 * s, 24, 16), new THREE.MeshBasicMaterial({ color: GOLD.clone().multiplyScalar(3), toneMapped: false })));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 1.6 * s, 34 * s, 24, 1, true), beamMat);
    beam.position.y = 17 * s;
    o.add(beam);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 64),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.3;
      ring.userData.phase = i / 3;
      o.add(ring);
      rings.push(ring);
    }
    o.userData = { rings, scale: s };
    group.add(o);
    hubObjs[h.id] = o;
  });

  /* ---- freight lanes: arcs with flowing light ---- */
  const laneMats = [];
  function arc(a, b, lift, color, width, speed, alpha) {
    const A = new THREE.Vector3(a.x, 0.5, a.y), B = new THREE.Vector3(b.x, 0.5, b.y);
    const M = A.clone().add(B).multiplyScalar(0.5);
    M.y = lift;
    const curve = new THREE.QuadraticBezierCurve3(A, M, B);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: color }, uSpeed: { value: speed }, uAlpha: { value: alpha }, uDraw: { value: 0 } },
      vertexShader: `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime, uSpeed, uAlpha, uDraw; uniform vec3 uColor; varying float vU;
        void main(){
          if (vU > uDraw) discard;
          float pulse = pow(fract(vU * 3.0 - uTime * uSpeed), 6.0);
          float base = 0.28;
          gl_FragColor = vec4(uColor * (base + pulse * 2.6), (base + pulse) * uAlpha);
        }`,
    });
    laneMats.push(mat);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, width, 6, false), mat));
  }
  const byId = Object.fromEntries(HUBS.map(h => [h.id, project(h.lon, h.lat)]));
  LANES.forEach(([a, b]) => {
    const A = byId[a], B = byId[b];
    arc(A, B, 6 + A.distanceTo(B) * 0.32, GOLD, 0.38, 0.45, 1);
  });
  // thinner on-demand lanes from the nearest hub to a spread of districts
  {
    const rnd = mulberry(11);
    for (let i = 0; i < 22; i++) {
      const d = districts[Math.floor(rnd() * districts.length)];
      let best = null, bd = 1e9;
      for (const id in byId) { const dd = byId[id].distanceTo(d); if (dd < bd) { bd = dd; best = byId[id]; } }
      if (bd < 4) continue;
      arc(best, d, 2 + bd * 0.28, CYAN, 0.12, 0.25 + rnd() * 0.3, 0.55);
    }
  }

  group.rotation.x = 0;
  group.position.set(0, 0, 0);

  /* ---- post ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---- labels (HTML, positioned each frame) ---- */
  const labels = (opts.labels || []).map(el => ({ el, obj: hubObjs[el.dataset.hub] })).filter(l => l.obj);

  /* ---- state ---- */
  let progress = 0, active = false, w = 0, h = 0, raf = 0, last = 0, t = 0;
  const pointer = new THREE.Vector2(), pointerS = new THREE.Vector2();
  const tmp = new THREE.Vector3();

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, w < 800 ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w * dpr / 2, h * dpr / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  function frame(now) {
    raf = active ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!still) t += dt;

    const p = ease(Math.min(1, progress));
    pointerS.lerp(pointer, 1 - Math.pow(0.001, dt));

    // Camera: descend from high above the Bay of Bengal into a 3/4 view.
    const narrow = w < 700;
    // Keep the whole country in frame horizontally on any aspect ratio.
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const fit = 68 / Math.tan(halfH);
    const dist = Math.max(THREE.MathUtils.lerp(330, 175, p), fit);
    const tilt = THREE.MathUtils.lerp(1.25, 0.82, p);   // polar angle from vertical
    const yaw = THREE.MathUtils.lerp(-0.55, 0.12, p) + (still ? 0 : Math.sin(t * 0.08) * 0.05) + pointerS.x * 0.12;
    camera.position.set(Math.sin(yaw) * Math.sin(tilt) * dist, Math.cos(tilt) * dist + pointerS.y * 14, Math.cos(yaw) * Math.sin(tilt) * dist + 20);
    camera.lookAt(narrow ? 0 : -14, 0, narrow ? 4 : 6);

    topMat.uniforms.uTime.value = t;
    topMat.uniforms.uReveal.value = Math.min(1, progress * 1.6);
    beamMat.uniforms.uTime.value = t;
    scene.userData.stars.uniforms.uTime.value = t;
    const draw = THREE.MathUtils.clamp((progress - 0.25) / 0.45, 0, 1);
    laneMats.forEach(m => { m.uniforms.uTime.value = t; m.uniforms.uDraw.value = draw; });
    for (const id in hubObjs) {
      const o = hubObjs[id];
      o.userData.rings.forEach(r => {
        const k = (t * 0.35 + r.userData.phase) % 1;
        const s = (1 + k * 9) * o.userData.scale;
        r.scale.set(s, s, s);
        r.material.opacity = (1 - k) * 0.55 * Math.min(1, progress * 2);
      });
    }

    composer.render();

    // Labels follow their hubs.
    const show = progress > 0.35;
    labels.forEach(l => {
      l.obj.getWorldPosition(tmp);
      tmp.y += 6;
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      l.el.classList.toggle('on', show && tmp.z < 1);
    });
  }

  function onPointer(e) {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', resize);
  resize();

  return {
    setProgress(v) { progress = v; },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) { last = 0; raf = requestAnimationFrame(frame); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    resize,
  };
}
