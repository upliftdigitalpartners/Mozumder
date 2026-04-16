/* ==========================================================
   Mozumder Company — Main JS
   ---------------------------------------------------------
   - Sticky header state
   - Mobile nav toggle
   - Scroll reveal via IntersectionObserver
   - Count-up animation for stat numbers
   - Active link highlight
   ========================================================== */

(function () {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  /* --- Header solid state on scroll --- */
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 12) header.classList.add('is-solid');
    else header.classList.remove('is-solid');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Mobile nav toggle --- */
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Active nav link by current page --- */
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* --- Scroll reveal --- */
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in'));
  }

  /* --- Stat count-up --- */
  const stats = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && stats.length) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const duration = 1400;
        const start = performance.now();
        const startValue = 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const isDecimal = !Number.isInteger(target);

        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = startValue + (target - startValue) * eased;
          el.textContent = prefix + (isDecimal ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    stats.forEach(el => countIO.observe(el));
  }

  /* --- Year in footer --- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* --- Contact form: mailto fallback (no backend needed, works on static hosting) --- */
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = encodeURIComponent(data.get('name') || '');
      const email = encodeURIComponent(data.get('email') || '');
      const phone = encodeURIComponent(data.get('phone') || '');
      const subject = encodeURIComponent(data.get('subject') || 'Logistics Enquiry — Mozumder');
      const msg = encodeURIComponent(data.get('message') || '');
      const body =
        `Name: ${decodeURIComponent(name)}%0D%0A` +
        `Email: ${decodeURIComponent(email)}%0D%0A` +
        `Phone: ${decodeURIComponent(phone)}%0D%0A%0D%0A` +
        `${decodeURIComponent(msg)}`;
      window.location.href = `mailto:info@mozumderbd.net?subject=${subject}&body=${body}`;
    });
  }
})();
