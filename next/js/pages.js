/* Mozumder — inner-page headers: start the header loop (sized for the
   screen) and give the media a little depth against the pointer. */
(function () {
  "use strict";
  var hero = document.querySelector(".inner-hero.has-media");
  if (!hero) return;
  var media = hero.querySelector(".hero-media");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;

  var v = media && media.querySelector("video");
  if (v && !still) {
    v.src = v.getAttribute(small ? "data-src-sm" : "data-src-lg");
    v.load();
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
