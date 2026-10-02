/* =========================================================
   Mozumder — cinematic homepage
   A fixed "stage" holds one layer per chapter (looping video,
   scroll-scrubbed image sequence, or the 3D network map). The
   chapter sections scroll over it as ordinary content; whichever
   chapter owns the middle of the viewport is shown, and adjacent
   chapters crossfade at their boundary.

   Loading order, lightest first:
   1. posters (in the HTML) — the page is usable straight away;
   2. videos — once the page has loaded and the browser is idle;
   3. scroll sequences — only after the visitor starts scrolling.
   Browsers that decode AV1 / AVIF efficiently get those smaller files;
   slow connections and Data Saver get stills instead of video.
   ========================================================= */
(function () {
  'use strict';

  const doc = document.documentElement;
  const stage = document.querySelector('.stage');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  if (!stage || !chapters.length) return;
  doc.classList.add('cinema-on');

  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  // Phones/tablets held upright get native-resolution portrait cuts of the
  // footage; everything else gets the 1280px landscape versions.
  const portrait = mq('(orientation: portrait) and (max-width: 1024px)');
  const still = mq('(prefers-reduced-motion: reduce)');
  const conn = navigator.connection || {};
  const slow = !!conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || '');
  const header = document.querySelector('.site-header');
  const rail = [...document.querySelectorAll('.chapter-rail a')];
  const content = document.querySelector('.after-cinema');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

  /* ---------------- format support ---------------- */
  // AVIF: decode a tiny image. AV1: on touch devices only where decoding is
  // power-efficient (hardware), so older phones keep the H.264 files; on
  // desktops wherever playback is smooth.
  const avifOK = new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img.width > 0);
    img.onerror = () => res(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAWAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAebWRhdAoFGAA2wCAyDRgAAABQAAAAALASmcg=';
  });
  const av1OK = (navigator.mediaCapabilities && navigator.mediaCapabilities.decodingInfo
    ? navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        video: { contentType: 'video/mp4; codecs="av01.0.05M.08"', width: 1280, height: 720, bitrate: 1500000, framerate: 24 },
      }).then((r) => r.supported && (r.powerEfficient || (!mq('(pointer: coarse)') && r.smooth)), () => false)
    : Promise.resolve(false));

  /* ---------------- loading gates ---------------- */
  let videosAllowed = false, seqAllowed = window.scrollY > 40;
  const afterLoad = () => {
    const go = () => { videosAllowed = !slow; kick(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 300);
  };
  if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad, { once: true });

  /* ---------------- image sequences ---------------- */
  class Sequence {
    constructor(canvas, name, count) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.count = count;
      this.base = `media/home/seq/${name}/${portrait ? 'pt' : 'lg'}/`;
      this.frames = new Array(count);
      this.started = false;
      this.drawn = -1;
    }
    load() {
      if (this.started) return;
      this.started = true;
      avifOK.then((avif) => {
        const ext = avif ? '.avif' : '.webp';
        // Coarse-to-fine: every 8th frame first so scrubbing works early.
        // On slow connections, stop at every 4th frame.
        const order = [], seen = new Set();
        (slow ? [8, 4] : [8, 4, 2, 1]).forEach((s) => { for (let i = 0; i < this.count; i += s) if (!seen.has(i)) { seen.add(i); order.push(i); } });
        if (!seen.has(this.count - 1)) order.splice(1, 0, this.count - 1);
        let next = 0;
        const pump = () => {
          if (next >= order.length) return;
          const i = order[next++];
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            // Decode before first use so drawing never stalls the frame.
            const done = () => { this.frames[i] = img; this.drawn = -1; kick(); pump(); };
            if (img.decode) img.decode().then(done, done); else done();
          };
          img.onerror = pump;
          img.src = this.base + String(i + 1).padStart(3, '0') + ext;
        };
        for (let k = 0; k < 6; k++) pump();
      });
    }
    nearest(i) {
      if (this.frames[i]) return i;
      for (let d = 1; d < this.count; d++) {
        if (this.frames[i - d]) return i - d;
        if (this.frames[i + d]) return i + d;
      }
      return -1;
    }
    size() {
      // The canvas fills the fixed stage, i.e. the viewport: no layout read needed.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(vw * dpr), h = Math.round(vh * dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; this.drawn = -1; }
    }
    cover(img, alpha) {
      const cw = this.canvas.width, ch = this.canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    // Draw at fractional position p (0..1). While moving, neighbouring frames
    // are blended (reads as motion blur); at rest, snap to one crisp frame.
    draw(p, moving) {
      let f = p * (this.count - 1);
      if (!moving) f = Math.round(f);
      const key = Math.round(f * 24);
      if (key === this.drawn) return;
      const i = Math.floor(f), frac = f - i;
      const a = this.nearest(i);
      if (a < 0) return;
      this.cover(this.frames[a], 1);
      const b = i + 1 < this.count && this.frames[i + 1] && a === i ? i + 1 : -1;
      if (b > 0 && frac > 0.02) this.cover(this.frames[b], frac);
      this.ctx.globalAlpha = 1;
      this.drawn = key;
    }
  }

  /* ---------------- layers ---------------- */
  const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const layers = {};
  stage.querySelectorAll('[data-layer]').forEach((el) => {
    const L = { el, name: el.dataset.layer, opacity: -1 };
    const video = el.querySelector('video');
    const canvas = el.querySelector('canvas.seq');
    if (video) {
      L.video = video;
      // Posters are set from data-poster only when needed (and in the right
      // orientation), so phones don't download landscape stills they never show.
      const poster = video.dataset.poster && (portrait ? video.dataset.poster.replace(/\.jpg$/, '-pt.jpg') : video.dataset.poster);
      L.showPoster = () => { if (poster && !video.poster) video.poster = poster; };
      if (L.name === 'hero') L.showPoster();
      L.attach = () => {
        L.showPoster();
        if (L.attached || !videosAllowed) return;
        L.attached = true;
        const src = video.dataset[portrait ? 'srcPt' : 'srcLg'];
        if (!src) return;
        av1OK.then((av1) => {
          video.src = av1 ? src.replace(/\.mp4$/, '.av1.mp4') : src;
          video.load();
        });
        video.addEventListener('canplay', () => { if (L.opacity > 0 && !still) play(video); });
      };
    }
    if (canvas) {
      L.seq = new Sequence(canvas, el.dataset.seq, +el.dataset.frames || 72);
      L.attach = () => { if (seqAllowed) L.seq.load(); };
    }
    layers[L.name] = L;
  });

  function setOpacity(L, o) {
    if (!L) return;
    o = Math.round(o * 1000) / 1000;
    if (o === L.opacity) return;
    L.opacity = o;
    L.el.style.opacity = o;
    L.el.style.visibility = o > 0 ? 'visible' : 'hidden';
    if (L.video && L.attached) {
      if (o > 0 && !still) play(L.video);
      else L.video.pause();
    }
  }

  /* ---------------- 3D map (loaded on approach) ---------------- */
  let map = null, mapLoading = false;
  const mapLayer = layers.map;
  function loadMap() {
    if (map || mapLoading || !mapLayer) return;
    mapLoading = true;
    const canvas = mapLayer.el.querySelector('canvas.webgl');
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) { mapLayer.el.classList.add('no-webgl'); return; }
    import('./network-map.js').then((m) => {
      map = m.createNetworkMap(canvas, {
        reducedMotion: still,
        labels: [...mapLayer.el.querySelectorAll('[data-hub]')],
      });
      mapLayer.el.classList.add('ready');
      kick();
    }).catch(() => mapLayer.el.classList.add('no-webgl'));
  }

  /* ---------------- geometry (measured, not read every frame) ---------------- */
  let vw = doc.clientWidth, vh = window.innerHeight;
  let geo = [], contentTop = Infinity;
  function measure() {
    vw = doc.clientWidth; vh = window.innerHeight;
    const y = window.scrollY;
    geo = chapters.map((sec) => { const r = sec.getBoundingClientRect(); return { top: r.top + y, height: r.height }; });
    contentTop = content ? content.getBoundingClientRect().top + y : Infinity;
  }

  /* ---------------- update (reads cached geometry, then writes) ---------------- */
  const smoothP = new Map();      // chapter -> eased scrub progress
  let settling = false;

  function update() {
    const y = window.scrollY;
    const c = vh * 0.5, f = vh * 0.5;   // crossfade over half a screen around the centre
    let owner = 0;
    settling = false;

    chapters.forEach((sec, i) => {
      const g = geo[i];
      const top = g.top - y, bottom = top + g.height;
      const name = sec.dataset.chapter;
      const fin = i === 0 ? 1 : smooth(c + f / 2, c - f / 2, top);
      const fout = i === chapters.length - 1 && !content ? 1 : smooth(c - f / 2, c + f / 2, bottom);
      const w = Math.min(fin, fout);
      if (top <= c && bottom > c) owner = i;

      // Scrub progress through the section (0 at its top, 1 when its end reaches the viewport bottom).
      const target = clamp(-top / Math.max(1, g.height - vh));
      const prev = smoothP.has(sec) ? smoothP.get(sec) : target;
      let p = still ? target : prev + (target - prev) * 0.14;
      if (Math.abs(p - target) < 1e-4) p = target;
      const moving = p !== target;
      if (moving) settling = true;
      smoothP.set(sec, p);

      // Attach media when within ~1.5 screens.
      const near = top < vh * 2.5 && bottom > -vh;
      const lay = (sec.dataset.layers || name).split(',');
      if (near) lay.forEach((n) => { const L = layers[n]; if (L && L.attach) L.attach(); });
      if (name === 'network' && near && seqAllowed) loadMap();

      if (name === 'network') {
        // Drone rises into the stars, then the 3D map takes over.
        const mapIn = smooth(0.38, 0.52, p);
        setOpacity(layers.rise, w);
        setOpacity(mapLayer, w * mapIn);
        if (layers.rise && layers.rise.seq && w > 0) { layers.rise.seq.size(); layers.rise.seq.draw(clamp(p / 0.5), moving); }
        if (map) {
          map.setActive(w * mapIn > 0.01);
          map.setProgress(clamp((p - 0.4) / 0.5));
        }
      } else {
        lay.forEach((n) => {
          const L = layers[n];
          setOpacity(L, w);
          if (L && L.seq && w > 0) { L.seq.size(); L.seq.draw(p, moving); }
        });
      }
    });

    // Rail + header state.
    const ct = contentTop - y;
    const inCinema = ct > 64;
    rail.forEach((a, i) => a.classList.toggle('on', i === owner));
    doc.classList.toggle('in-cinema', inCinema);
    if (header) header.classList.toggle('cinema', inCinema);
    stage.style.visibility = inCinema || ct > 0 ? 'visible' : 'hidden';
  }

  /* ---------------- run only while something is moving ---------------- */
  let running = false, lastInput = 0;
  function tick() {
    update();
    if (settling || performance.now() - lastInput < 200) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }
  window.addEventListener('scroll', () => {
    lastInput = performance.now();
    if (!seqAllowed) seqAllowed = true;   // first scroll unlocks the scroll scenes
    kick();
  }, { passive: true });
  window.addEventListener('resize', () => { measure(); if (map) map.resize(); lastInput = performance.now(); kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); kick(); }).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); kick(); });
  measure();
  kick();

  /* ---------------- text panels reveal ---------------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.panel, .map-copy').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.panel, .map-copy').forEach((el) => el.classList.add('in'));
  }

  /* Background loop behind the CTA band: load near, play while visible. */
  document.querySelectorAll('video.cta-bg').forEach((v) => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !v.poster && v.dataset.poster) v.poster = v.dataset.poster;
      if (e.isIntersecting && !v.src && !slow) {
        av1OK.then((av1) => { v.src = av1 ? v.dataset.srcLg.replace(/\.mp4$/, '.av1.mp4') : v.dataset.srcLg; v.load(); });
      }
      if (still || slow) return;
      if (e.isIntersecting) play(v); else v.pause();
    }), { rootMargin: '200px 0px' });
    io.observe(v);
  });

  /* Rail links scroll to the chapter. */
  rail.forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.offsetTop + 2, behavior: still ? 'auto' : 'smooth' });
  }));
})();
