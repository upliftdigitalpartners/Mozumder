/* =========================================================
   Mozumder — motion layer
   Inertial scrolling, scroll-linked parallax and pointer
   micro-interactions. No dependencies.

   Everything here is additive: if this file fails to load or
   throws, the site scrolls and renders exactly as before.
   ========================================================= */
(function () {
  "use strict";

  var root    = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Touch devices already have momentum scrolling tuned by the OS. Hijacking
  // it makes the page feel worse, not better, so leave it alone.
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- 1. Inertial scroll ----------
     Native scroll position is eased toward a virtual target each frame.
     Real scrolling is kept (not a transformed wrapper) so the fixed header,
     anchor links and the scrollbar all keep working. */
  var lerp = { target: window.scrollY, current: window.scrollY, running: false, ease: 0.11 };
  var lastWritten = Math.round(window.scrollY);

  function jump(y) {
    lastWritten = Math.round(y);
    window.scrollTo({ top: y, behavior: "instant" });
  }

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function frame() {
    var diff = lerp.target - lerp.current;
    if (Math.abs(diff) < 0.4) {
      lerp.current = lerp.target;
      jump(lerp.current);
      lerp.running = false;
      root.classList.remove("is-scrolling");
      return;
    }
    lerp.current += diff * lerp.ease;
    jump(lerp.current);
    requestAnimationFrame(frame);
  }

  function start() {
    if (lerp.running) return;
    lerp.running = true;
    root.classList.add("is-scrolling");
    requestAnimationFrame(frame);
  }

  function onWheel(e) {
    // Let genuinely scrollable panels (open nav, overflow boxes) scroll natively.
    for (var n = e.target; n && n !== document.body; n = n.parentElement) {
      if (n.hasAttribute && n.hasAttribute("data-native-scroll")) return;
    }
    if (e.ctrlKey) return;                 // pinch zoom
    e.preventDefault();
    lerp.target = Math.min(maxScroll(), Math.max(0, lerp.target + e.deltaY));
    start();
  }

  // Anything that moves the page by other means (keyboard, scrollbar drag,
  // anchor jump, find-in-page, scrollTo) must win. A position we did not write
  // ourselves is by definition external, so adopt it and drop our target.
  function resync() {
    var y = window.scrollY;
    if (Math.abs(y - lastWritten) > 2) {
      lerp.target = lerp.current = y;
      lastWritten = Math.round(y);
      lerp.running = false;
    }
  }

  // Ease to an absolute position through the same loop, so programmatic
  // scrolls feel identical to wheel scrolls.
  function scrollToY(y) {
    lerp.target = Math.min(maxScroll(), Math.max(0, y));
    start();
  }

  var smooth = !isTouch && !reduced.matches;
  if (smooth) {
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", resync, { passive: true });
    window.addEventListener("resize", resync);
    root.classList.add("has-smooth-scroll");

    // CSS sets html{scroll-behavior:smooth}. With our loop running that would
    // mean two animators fighting over one scroll position, so ours takes over
    // and same-page anchors are eased here instead.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY
              - (parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 82) - 12;
      scrollToY(top);
      history.pushState(null, "", id);
    });

    // Expose it so other scripts can move the page without being dragged back.
    window.mozScrollTo = scrollToY;
  }

  /* ---------- 2. Scroll-linked parallax ----------
     data-parallax="0.15" -> element drifts at 15% of scroll distance while
     it is on screen. Transform only, so it never triggers layout. */
  var layers = [].slice.call(document.querySelectorAll("[data-parallax]"));
  if (layers.length && !reduced.matches) {
    var ticking = false;
    var apply = function () {
      var vh = window.innerHeight;
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var r  = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var amount   = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;   // -1 .. 1 ish
        el.style.transform = "translate3d(0," + (progress * amount * 100).toFixed(2) + "px,0)";
      }
      ticking = false;
    };
    var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    apply();
  }

  /* ---------- 3. Pointer micro-interactions ----------
     A card tilts a degree or two toward the cursor and lights up where the
     pointer is. Desktop only; pure CSS custom properties so the work stays
     on the compositor. */
  if (!isTouch && !reduced.matches) {
    var cards = document.querySelectorAll(".service-card, .concern-card, .fleet-card, .stat-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--px", ((e.clientX - r.left) / r.width).toFixed(3));
          card.style.setProperty("--py", ((e.clientY - r.top) / r.height).toFixed(3));
        });
        card.addEventListener("pointerleave", function () {
          card.style.removeProperty("--px");
          card.style.removeProperty("--py");
        });
      })(cards[i]);
    }
  }

  root.classList.add("motion-ready");
})();
