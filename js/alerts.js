/* =========================================================
   Mozumder — operational notices strip

   Reads data/alerts.json and shows anything currently in its
   date window in a slim bar under the header. Content people
   edit lives in the JSON; nothing here needs changing to post
   a notice.

   Renders nothing at all when the file is missing, malformed,
   empty, or every entry has expired — so a failure here is
   invisible rather than broken.
   ========================================================= */
(function () {
  "use strict";

  var STORE = "moz-alerts-dismissed";

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  function dismissed() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]"); }
    catch (e) { return []; }          // private mode, blocked storage
  }
  function remember(id) {
    try {
      var l = dismissed();
      if (l.indexOf(id) === -1) { l.push(id); localStorage.setItem(STORE, JSON.stringify(l)); }
    } catch (e) { /* nothing to do; the notice simply returns next visit */ }
  }

  function live(a) {
    if (!a || !a.id || !a.text) return false;
    var t = today();
    if (a.from  && t <  a.from)  return false;
    if (a.until && t >= a.until) return false;   // until is exclusive
    return true;
  }

  function build(list) {
    var bar = document.createElement("div");
    bar.className = "alert-bar";
    bar.setAttribute("role", "status");
    bar.setAttribute("aria-live", "polite");

    var inner = document.createElement("div");
    inner.className = "alert-inner container";

    var slot = document.createElement("div");
    slot.className = "alert-slot";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "alert-close";
    close.setAttribute("aria-label", "Dismiss notice");
    close.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    inner.appendChild(slot);
    inner.appendChild(close);
    bar.appendChild(inner);

    var i = 0, timer = null;

    function paint() {
      var a = list[i];
      bar.setAttribute("data-level", a.level || "info");
      slot.innerHTML = "";
      var dot = document.createElement("span");
      dot.className = "alert-dot";
      dot.setAttribute("aria-hidden", "true");
      var txt = a.url ? document.createElement("a") : document.createElement("span");
      if (a.url) txt.href = a.url;
      txt.className = "alert-text";
      txt.textContent = a.text;
      slot.appendChild(dot);
      slot.appendChild(txt);
      if (list.length > 1) {
        var n = document.createElement("span");
        n.className = "alert-count";
        n.textContent = (i + 1) + " / " + list.length;
        slot.appendChild(n);
      }
    }

    function rotate() {
      if (list.length < 2) return;
      timer = setInterval(function () {
        i = (i + 1) % list.length;
        slot.classList.add("is-swapping");
        setTimeout(function () { paint(); slot.classList.remove("is-swapping"); }, 220);
      }, 7000);
    }

    close.addEventListener("click", function () {
      list.forEach(function (a) { remember(a.id); });
      bar.classList.remove("is-open");
      if (timer) clearInterval(timer);
      setTimeout(function () { bar.remove(); document.documentElement.classList.remove("has-alert"); }, 320);
    });
    bar.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    bar.addEventListener("mouseleave", rotate);

    paint();
    document.body.appendChild(bar);
    document.documentElement.classList.add("has-alert");
    requestAnimationFrame(function () { bar.classList.add("is-open"); });
    rotate();
  }

  if (!window.fetch) return;
  fetch("data/alerts.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !Array.isArray(d.alerts)) return;
      var seen = dismissed();
      var list = d.alerts.filter(live).filter(function (a) { return seen.indexOf(a.id) === -1; });
      if (list.length) build(list);
    })
    .catch(function () { /* no notice is the correct outcome of any failure here */ });
})();
