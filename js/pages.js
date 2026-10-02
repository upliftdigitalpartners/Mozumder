/* Mozumder — inner-page headers: start the header loop (sized for the
   screen) and give the media a little depth against the pointer. */
(function () {
  "use strict";
  var hero = document.querySelector(".inner-hero.has-media");
  if (!hero) return;
  var media = hero.querySelector(".hero-media");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var portrait = window.matchMedia && window.matchMedia("(orientation: portrait) and (max-width: 1024px)").matches;

  var conn = navigator.connection || {};
  var slow = !!conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || "");
  var v = media && media.querySelector("video");
  if (v && v.dataset.poster) v.poster = portrait ? v.dataset.poster.replace(/\.jpg$/, "-pt.jpg") : v.dataset.poster;
  if (v && !still && !slow) {
    // Poster first; the loop starts once the page has loaded. AV1 (smaller)
    // where the device decodes it efficiently, H.264 otherwise.
    var src = v.getAttribute(portrait ? "data-src-pt" : "data-src-lg");
    var start = function (av1) { v.src = av1 ? src.replace(/\.mp4$/, ".av1.mp4") : src; v.load(); };
    var pick = function () {
      var mc = navigator.mediaCapabilities;
      if (!mc || !mc.decodingInfo) return start(false);
      mc.decodingInfo({ type: "file", video: { contentType: 'video/mp4; codecs="av01.0.05M.08"', width: 1280, height: 720, bitrate: 1500000, framerate: 24 } })
        .then(function (r) {
          var coarse = window.matchMedia("(pointer: coarse)").matches;
          start(r.supported && (r.powerEfficient || (!coarse && r.smooth)));
        }, function () { start(false); });
    };
    if (document.readyState === "complete") pick(); else window.addEventListener("load", pick, { once: true });
    var go = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    v.addEventListener("canplay", go, { once: true });
    // Pause when the header scrolls away.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) go(); else v.pause(); });
      }).observe(hero);
    }
  }

  if (still || !window.matchMedia("(pointer: fine)").matches) return;
  hero.addEventListener("pointermove", function (e) {
    var r = hero.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    media.style.setProperty("--mx", (-x * 18).toFixed(1) + "px");
    media.style.setProperty("--my", (-y * 12).toFixed(1) + "px");
  });
  hero.addEventListener("pointerleave", function () {
    media.style.setProperty("--mx", "0px");
    media.style.setProperty("--my", "0px");
  });
})();
