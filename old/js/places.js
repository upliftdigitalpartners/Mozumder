/* =========================================================
   Mozumder — origin / destination autocomplete

   The two fields are plain text inputs in the HTML and stay
   usable as plain text inputs if this file never loads. This
   only layers a filtered listbox on top.

   The data is bundled rather than fetched. Bangladesh's 8
   divisions and 64 districts are a fixed, tiny list, and the
   freight locations below change even less often — a network
   call would add a failure mode and a wait for no benefit.
   ========================================================= */
(function () {
  "use strict";

  var D = "district", P = "seaport", L = "land port", A = "airport", Z = "EPZ / zone", I = "inland depot";

  // Freight locations first: these are what a shipper actually names.
  var PLACES = [
    ["Chattogram Port",            "Chattogram", P, ["chittagong port", "ctg port"]],
    ["Mongla Port",                "Khulna",     P, []],
    ["Payra Port",                 "Barishal",   P, []],
    ["Benapole Land Port",         "Khulna",     L, ["banapole"]],
    ["Bhomra Land Port",           "Khulna",     L, []],
    ["Hili Land Port",             "Rangpur",    L, []],
    ["Akhaura Land Port",          "Chattogram", L, []],
    ["Sonamasjid Land Port",       "Rajshahi",   L, []],
    ["Burimari Land Port",         "Rangpur",    L, []],
    ["Tamabil Land Port",          "Sylhet",     L, []],
    ["Hazrat Shahjalal Intl Airport (Dhaka)", "Dhaka", A, ["dac", "dhaka airport"]],
    ["Shah Amanat Intl Airport (Chattogram)", "Chattogram", A, ["cgp", "chittagong airport"]],
    ["Osmani Intl Airport (Sylhet)",          "Sylhet", A, ["zyl"]],
    ["Kamalapur ICD (Dhaka)",      "Dhaka",      I, ["icd", "inland container depot"]],
    ["Chattogram EPZ (CEPZ)",      "Chattogram", Z, ["cepz", "chittagong epz"]],
    ["Karnaphuli EPZ (KEPZ)",      "Chattogram", Z, ["kepz"]],
    ["Dhaka EPZ (Savar)",          "Dhaka",      Z, ["depz", "savar epz"]],
    ["Adamjee EPZ (Narayanganj)",  "Dhaka",      Z, ["aepz"]],
    ["Cumilla EPZ",                "Chattogram", Z, ["comilla epz"]],
    ["Mongla EPZ",                 "Khulna",     Z, []],
    ["Uttara EPZ (Nilphamari)",    "Rangpur",    Z, []],
    ["Ishwardi EPZ (Pabna)",       "Rajshahi",   Z, []],
    ["Bangabandhu Shilpa Nagar (Mirsharai)", "Chattogram", Z, ["mirsharai", "bsmsn"]]
  ];

  // All 64 districts, by division. Aliases carry the pre-2018 spellings people
  // still type — a shipper writing "Chittagong" or "Jessore" must still match.
  var DISTRICTS = {
    "Barishal":   [["Barguna"], ["Barishal", ["barisal"]], ["Bhola"], ["Jhalokati"], ["Patuakhali"], ["Pirojpur"]],
    "Chattogram": [["Bandarban"], ["Brahmanbaria"], ["Chandpur"], ["Chattogram", ["chittagong", "ctg"]],
                   ["Cumilla", ["comilla"]], ["Cox's Bazar", ["coxs bazar", "cox bazar"]], ["Feni"],
                   ["Khagrachhari", ["khagrachari"]], ["Lakshmipur"], ["Noakhali"], ["Rangamati"]],
    "Dhaka":      [["Dhaka", ["dacca"]], ["Faridpur"], ["Gazipur"], ["Gopalganj"], ["Kishoreganj"],
                   ["Madaripur"], ["Manikganj"], ["Munshiganj"], ["Narayanganj"], ["Narsingdi"],
                   ["Rajbari"], ["Shariatpur"], ["Tangail"]],
    "Khulna":     [["Bagerhat"], ["Chuadanga"], ["Jashore", ["jessore"]], ["Jhenaidah"], ["Khulna"],
                   ["Kushtia"], ["Magura"], ["Meherpur"], ["Narail"], ["Satkhira"]],
    "Mymensingh": [["Jamalpur"], ["Mymensingh"], ["Netrokona", ["netrakona"]], ["Sherpur"]],
    "Rajshahi":   [["Bogura", ["bogra"]], ["Chapainawabganj", ["chapai nawabganj", "nawabganj"]],
                   ["Joypurhat"], ["Naogaon"], ["Natore"], ["Pabna"], ["Rajshahi"], ["Sirajganj", ["sirajgonj"]]],
    "Rangpur":    [["Dinajpur"], ["Gaibandha"], ["Kurigram"], ["Lalmonirhat"], ["Nilphamari"],
                   ["Panchagarh"], ["Rangpur"], ["Thakurgaon"]],
    "Sylhet":     [["Habiganj"], ["Moulvibazar", ["maulvibazar"]], ["Sunamganj"], ["Sylhet"]]
  };

  var ITEMS = [];
  for (var i = 0; i < PLACES.length; i++) {
    ITEMS.push({ name: PLACES[i][0], sub: PLACES[i][1], kind: PLACES[i][2], alias: PLACES[i][3] });
  }
  Object.keys(DISTRICTS).forEach(function (div) {
    DISTRICTS[div].forEach(function (d) {
      ITEMS.push({ name: d[0], sub: div, kind: D, alias: d[1] || [] });
    });
  });

  function norm(s) { return s.toLowerCase().replace(/['’.]/g, "").replace(/\s+/g, " ").trim(); }

  function match(q) {
    q = norm(q);
    if (!q) return ITEMS.slice(0, 8);
    var starts = [], contains = [];
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i], n = norm(it.name), hit = -1;
      if (n.indexOf(q) === 0) hit = 0;
      else if (n.indexOf(q) > 0) hit = 1;
      else {
        for (var a = 0; a < it.alias.length; a++) {
          var an = norm(it.alias[a]);
          if (an.indexOf(q) === 0) { hit = 0; break; }
          if (an.indexOf(q) > 0) { hit = 1; break; }
        }
      }
      if (hit === 0) starts.push(it); else if (hit === 1) contains.push(it);
    }
    return starts.concat(contains).slice(0, 9);
  }

  function attach(input) {
    if (!input) return;
    var box = document.createElement("div");
    box.className = "ac-list";
    box.setAttribute("role", "listbox");
    box.id = input.id + "-list";
    box.hidden = true;
    var wrap = document.createElement("div");
    wrap.className = "ac-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.appendChild(box);

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", box.id);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("autocomplete", "off");

    var results = [], active = -1;

    function close() {
      box.hidden = true; active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function paint() {
      box.innerHTML = "";
      results.forEach(function (it, idx) {
        var o = document.createElement("div");
        o.className = "ac-opt" + (idx === active ? " is-active" : "");
        o.id = box.id + "-" + idx;
        o.setAttribute("role", "option");
        o.setAttribute("aria-selected", idx === active ? "true" : "false");
        o.innerHTML = '<span class="ac-name"></span><span class="ac-meta"></span>';
        o.querySelector(".ac-name").textContent = it.name;
        o.querySelector(".ac-meta").textContent = it.kind === D ? it.sub : it.kind;
        o.addEventListener("mousedown", function (e) { e.preventDefault(); choose(idx); });
        box.appendChild(o);
      });
      box.hidden = results.length === 0;
      input.setAttribute("aria-expanded", results.length ? "true" : "false");
      if (active >= 0) input.setAttribute("aria-activedescendant", box.id + "-" + active);
      else input.removeAttribute("aria-activedescendant");
    }

    function choose(idx) {
      if (idx < 0 || idx >= results.length) return;
      input.value = results[idx].name;
      close();
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    input.addEventListener("input", function () { results = match(input.value); active = -1; paint(); });
    input.addEventListener("focus", function () { results = match(input.value); active = -1; paint(); });
    input.addEventListener("blur", function () { setTimeout(close, 120); });
    input.addEventListener("keydown", function (e) {
      if (box.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        results = match(input.value); active = -1; paint(); return;
      }
      if (box.hidden) return;
      if (e.key === "ArrowDown")      { e.preventDefault(); active = (active + 1) % results.length; paint(); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); active = (active - 1 + results.length) % results.length; paint(); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(active); }
      else if (e.key === "Escape")    { close(); }
      else if (e.key === "Tab" && active >= 0)   { choose(active); }
    });
  }

  attach(document.getElementById("q-origin"));
  attach(document.getElementById("q-dest"));
  document.documentElement.classList.add("places-ready");
})();
