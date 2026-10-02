/* Mozumder — fleet cards
   Each card carries an animated line drawing (inline SVG). When a card
   nears the viewport its studio video is attached on top; it fades in
   once the first frame is ready, plays while on screen and pauses off
   screen. Without JS, on data-saver, or if a video fails, the animated
   drawing stays. Reduced-motion users get the video's still frame. */
(function () {
  "use strict";
  var cards = document.querySelectorAll(".fleet-card");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("fx-managed");

  var MEDIA = "media/fleet/";
  var KINDS = ["skeletal", "flatbed", "lowbed", "tipper", "van", "tanker", "excavator", "crane", "tires"];
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {};
  var useVideo = !conn.saveData && !/(^|-)2g$|^3g$/.test(conn.effectiveType || "");

  function kindOf(card) {
    var svg = card.querySelector("svg.fx");
    if (!svg) return null;
    for (var i = 0; i < KINDS.length; i++) {
      if (svg.classList.contains("fx-" + KINDS[i])) return KINDS[i];
    }
    return null;
  }

  function attach(card) {
    if (card._video !== undefined) return card._video;
    card._video = null;
    var kind = kindOf(card);
    var box = card.querySelector(".fimg");
    if (!kind || !box || !useVideo) return null;
    var v = document.createElement("video");
    v.muted = true;            // property and attribute both, for iOS autoplay
    v.setAttribute("muted", "");
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.preload = still ? "metadata" : "auto";
    v.poster = MEDIA + kind + ".jpg";
    // H.264 first (hardware-decoded everywhere), VP9 for browsers without it.
    [["mp4", "video/mp4"], ["webm", "video/webm"]].forEach(function (f, i, all) {
      var s = document.createElement("source");
      s.src = MEDIA + kind + "." + f[0];
      s.type = f[1];
      // An error on the last source means nothing could play: keep the drawing.
      if (i === all.length - 1) s.addEventListener("error", function () { v.remove(); box.classList.remove("has-video"); });
      v.appendChild(s);
    });
    v.addEventListener("loadeddata", function () { box.classList.add("video-ready"); }, { once: true });
    box.classList.add("has-video");
    box.appendChild(v);
    card._video = v;
    if (!still && card.classList.contains("is-live")) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    return v;
  }

  // Attach a little before the card scrolls into view.
  var near = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      attach(e.target);
      near.unobserve(e.target);
    });
  }, { rootMargin: "400px 0px" });

  // Play only while actually on screen.
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle("is-live", e.isIntersecting);
      var v = e.target._video;
      if (!v || still) return;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.15 });

  cards.forEach(function (c) { near.observe(c); live.observe(c); });
})();
