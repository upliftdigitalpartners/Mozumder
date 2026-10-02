/* Mozumder — fleet card animations: only run the cards on screen. */
(function () {
  "use strict";
  var cards = document.querySelectorAll(".fleet-card");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("fx-managed");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle("is-live", e.isIntersecting); });
  }, { rootMargin: "80px" });
  cards.forEach(function (c) { io.observe(c); });
})();
