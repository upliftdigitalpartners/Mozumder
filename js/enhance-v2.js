/* Mozumder — enhance-v2.js
   Handles: language toggle, quote form submission, misc UX
   Loaded AFTER main.js and enhance.js
*/
(function () {
  "use strict";

  /* =========== i18n: English ↔ Bangla =========== */
  const I18N = {
    // Navigation
    "nav.home":       { en: "Home",          bn: "হোম" },
    "nav.about":      { en: "About",         bn: "আমাদের সম্পর্কে" },
    "nav.services":   { en: "Services",      bn: "সেবা" },
    "nav.fleet":      { en: "Fleet",         bn: "বহর" },
    "nav.concerns":   { en: "Sister Concerns", bn: "সহযোগী প্রতিষ্ঠান" },
    "nav.partners":   { en: "Partners",      bn: "পার্টনার" },
    "nav.contact":    { en: "Contact",       bn: "যোগাযোগ" },
    "cta.quote":      { en: "Get a Quote",   bn: "কোটেশন নিন" },

    // Hero
    "hero.eyebrow":   { en: "Streamlined Logistics, Accelerated Growth",
                        bn: "সুসংগঠিত লজিস্টিকস, দ্রুত অগ্রগতি" },
    "hero.h1.l1":     { en: "Moving Bangladesh's",     bn: "বাংলাদেশের শিল্পকে" },
    "hero.h1.l2":     { en: "industry forward —",      bn: "এগিয়ে নিচ্ছি —" },
    "hero.h1.l3.a":   { en: "on time,",                bn: "সময়মতো," },
    "hero.h1.l3.b":   { en: "every time.",             bn: "প্রতিবার।" },
    "hero.lead":      { en: "Since 2008, Mozumder has delivered reliable transportation, freight forwarding, heavy equipment and corporate supply to the country's most demanding shippers. A diversified fleet, a disciplined team, a single commitment: your cargo, handled right.",
                        bn: "২০০৮ সাল থেকে মজুমদার কোম্পানি দেশের সবচেয়ে কঠিন শিপারদের জন্য নির্ভরযোগ্য পরিবহন, ফ্রেইট ফরওয়ার্ডিং, ভারী যন্ত্রপাতি ও কর্পোরেট সরবরাহ প্রদান করছে। বৈচিত্র্যময় বহর, সুশৃঙ্খল দল, একটিই প্রতিশ্রুতি: আপনার পণ্য, সঠিকভাবে পরিচালিত।" },
    "hero.cta.primary":{ en: "Explore Services",      bn: "সেবা দেখুন" },
    "hero.cta.secondary":{ en: "Talk to a Specialist", bn: "বিশেষজ্ঞের সাথে কথা বলুন" },

    // Stats
    "stat.years":     { en: "Years of Service",       bn: "সেবার বছর" },
    "stat.clients":   { en: "Industrial Clients",     bn: "শিল্প গ্রাহক" },
    "stat.concerns":  { en: "Specialized Concerns",   bn: "বিশেষায়িত প্রতিষ্ঠান" },

    // Contact page
    "contact.h1":     { en: "Let's move your freight forward.",
                        bn: "আপনার পণ্য এগিয়ে নিতে প্রস্তুত।" },
    "contact.lead":   { en: "Tell us what you need to move. A specialist will respond within one business day with a transparent quote.",
                        bn: "আপনার প্রয়োজন আমাদের জানান। একজন বিশেষজ্ঞ এক কার্যদিবসের মধ্যে স্বচ্ছ কোটেশন দেবেন।" },

    // Quote form
    "q.h":            { en: "Request a Quote",       bn: "কোটেশনের জন্য অনুরোধ" },
    "q.sub":          { en: "Takes about 90 seconds. We reply the same day.",
                        bn: "প্রায় ৯০ সেকেন্ড সময় লাগে। আমরা সেই দিনই উত্তর দিই।" },
    "q.name":         { en: "Full name",             bn: "পূর্ণ নাম" },
    "q.company":      { en: "Company",               bn: "প্রতিষ্ঠান" },
    "q.phone":        { en: "Phone / WhatsApp",      bn: "ফোন / হোয়াটসঅ্যাপ" },
    "q.email":        { en: "Email",                 bn: "ইমেইল" },
    "q.service":      { en: "Service needed",        bn: "প্রয়োজনীয় সেবা" },
    "q.origin":       { en: "Origin (city / port)",  bn: "পণ্য সংগ্রহ স্থান" },
    "q.destination":  { en: "Destination (city / site)", bn: "পণ্য পৌঁছানোর স্থান" },
    "q.cargo":        { en: "Cargo type",            bn: "পণ্যের ধরন" },
    "q.tonnage":      { en: "Tonnage / units",       bn: "টন / একক" },
    "q.date":         { en: "Target move date",      bn: "পরিবহনের তারিখ" },
    "q.notes":        { en: "Anything else we should know?", bn: "অন্য কোনো তথ্য?" },
    "q.submit":       { en: "Send Quote Request",    bn: "অনুরোধ পাঠান" },
    "q.note":         { en: "We'll reply within 1 business day.",
                        bn: "আমরা ১ কার্যদিবসের মধ্যে উত্তর দিই।" },
    "q.success":      { en: "Thanks! Your request is in. We'll respond within one business day.",
                        bn: "ধন্যবাদ! আপনার অনুরোধ পেয়েছি। এক কার্যদিবসের মধ্যে উত্তর দেব।" },
    "q.error":        { en: "Something went wrong. Please call us at +880 1979-628953.",
                        bn: "কিছু ভুল হয়েছে। অনুগ্রহ করে কল করুন: +৮৮০ ১৯৭৯-৬২৮৯৫৩।" },

    "q.aside.h":      { en: "Why shippers choose Mozumder",
                        bn: "শিপাররা কেন মজুমদার বেছে নেন" },
    "q.aside.p":      { en: "Seventeen years on the ground. Over one hundred industrial clients. A fleet built for Bangladesh.",
                        bn: "১৭ বছরের অভিজ্ঞতা। ১০০+ শিল্প গ্রাহক। বাংলাদেশের জন্য তৈরি বহর।" },
    "q.bul.1.h":      { en: "Same-day response",      bn: "একই দিনে উত্তর" },
    "q.bul.1.p":      { en: "A real person, not a bot.", bn: "বাস্তব মানুষ, বট নয়।" },
    "q.bul.2.h":      { en: "Transparent pricing",   bn: "স্বচ্ছ মূল্য" },
    "q.bul.2.p":      { en: "No hidden fees. Line-item quotes.", bn: "কোনো গোপন ফি নেই। বিস্তারিত কোট।" },
    "q.bul.3.h":      { en: "Nationwide coverage",   bn: "সারাদেশে পরিষেবা" },
    "q.bul.3.p":      { en: "All 64 districts, port-to-site.", bn: "৬৪ জেলা, পোর্ট থেকে সাইট পর্যন্ত।" },
    "q.tel":          { en: "Or call +880 1979-628953", bn: "অথবা কল করুন +৮৮০ ১৯৭৯-৬২৮৯৫৩" },

    // Options
    "svc.transport":  { en: "Transportation",          bn: "পরিবহন" },
    "svc.freight":    { en: "Sea & Air Freight",       bn: "সমুদ্র ও আকাশ ফ্রেইট" },
    "svc.customs":    { en: "Customs Clearing",        bn: "কাস্টমস ক্লিয়ারিং" },
    "svc.warehouse":  { en: "Warehousing",             bn: "গুদামজাতকরণ" },
    "svc.heavy":      { en: "Heavy Equipment",         bn: "ভারী যন্ত্রপাতি" },
    "svc.corporate":  { en: "Corporate Supply",        bn: "কর্পোরেট সরবরাহ" },
    "svc.other":      { en: "Other / not sure",        bn: "অন্যান্য" }
  };

  function applyLang(lang) {
    document.body.classList.toggle("lang-bn", lang === "bn");
    document.body.classList.toggle("lang-en", lang !== "bn");
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      const rec = I18N[k];
      if (!rec || !rec[lang]) return;
      if (el.tagName === "OPTION") el.textContent = rec[lang];
      else el.textContent = rec[lang];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      const k = el.getAttribute("data-i18n-ph");
      const rec = I18N[k];
      if (rec && rec[lang]) el.setAttribute("placeholder", rec[lang]);
    });

    document.querySelectorAll(".lang-switch button").forEach(b => {
      b.classList.toggle("on", b.dataset.lang === lang);
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });

    try { localStorage.setItem("mzm-lang", lang); } catch {}
  }

  function initLangSwitch() {
    const sw = document.querySelector(".lang-switch");
    if (!sw) return;
    sw.addEventListener("click", e => {
      const btn = e.target.closest("button[data-lang]");
      if (!btn) return;
      applyLang(btn.dataset.lang);
    });
    let saved = "en";
    try { saved = localStorage.getItem("mzm-lang") || "en"; } catch {}
    applyLang(saved);
  }

  /* =========== Quote form =========== */
  function initQuoteForm() {
    const form = document.getElementById("quote-form");
    if (!form) return;
    const ok = form.querySelector(".quote-success");
    const err = form.querySelector(".quote-error");
    const btn = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      ok.classList.remove("on"); err.classList.remove("on");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Sending…";

      const data = new FormData(form);
      // Build a clean mailto / fetch payload.
      const payload = {};
      for (const [k, v] of data.entries()) payload[k] = v;

      // Compose email body for mailto fallback
      const subject = `Quote request — ${payload.name || "New lead"}${payload.company ? " (" + payload.company + ")" : ""}`;
      const lines = [
        `Name: ${payload.name}`,
        `Company: ${payload.company || "—"}`,
        `Phone/WhatsApp: ${payload.phone}`,
        `Email: ${payload.email || "—"}`,
        ``,
        `Service: ${payload.service}`,
        `Origin: ${payload.origin}`,
        `Destination: ${payload.destination}`,
        `Cargo type: ${payload.cargo || "—"}`,
        `Tonnage/units: ${payload.tonnage || "—"}`,
        `Target date: ${payload.date || "—"}`,
        ``,
        `Notes:`,
        payload.notes || "—"
      ];
      const body = lines.join("\n");

      // Try Formspree-style endpoint if configured; fall back to mailto
      const endpoint = form.dataset.endpoint;
      let sent = false;
      if (endpoint && /^https?:\/\//.test(endpoint)) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) sent = true;
        } catch {}
      }

      if (!sent) {
        // Mailto fallback — open user's mail client
        const to = form.dataset.email || "info.jakir15@gmail.com";
        const url = "mailto:" + encodeURIComponent(to) +
                    "?subject=" + encodeURIComponent(subject) +
                    "&body=" + encodeURIComponent(body);
        window.location.href = url;
        sent = true; // we assume mail client opened
      }

      if (sent) {
        ok.classList.add("on");
        form.reset();
      } else {
        err.classList.add("on");
      }
      btn.disabled = false;
      btn.textContent = originalLabel;
    });
  }

  /* =========== Init =========== */
  document.addEventListener("DOMContentLoaded", () => {
    initLangSwitch();
    initQuoteForm();
  });
})();
