/* ==========================================================
   Mozumder — Enhancement layer JS
   - Mouse-tracked service card glow
   - Ready class for hero intro
   - Tweaks panel (accent + motion)
   - Stats-band observer sync
   ========================================================== */

(function () {
  /* Flag body once loaded so hero can animate on first paint */
  requestAnimationFrame(() => document.body.classList.add('is-ready'));

  /* Mouse-tracked radial glow on service cards */
  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });

  /* Add .in class on stat-card when in view for left-border animation */
  const statCards = document.querySelectorAll('.stat-card');
  if ('IntersectionObserver' in window && statCards.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    statCards.forEach((el) => io.observe(el));
  }

  /* Tweaks panel ------------------------------------------------- */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "gold",
    "motion": "on"
  }/*EDITMODE-END*/;

  const state = { ...TWEAK_DEFAULTS };
  let panel = null;

  function applyState() {
    document.body.dataset.accent = state.accent;
    document.documentElement.style.setProperty('--motion', state.motion);
    if (state.motion === 'off') {
      document.documentElement.classList.add('motion-off');
    } else {
      document.documentElement.classList.remove('motion-off');
    }
  }

  function buildPanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.innerHTML = `
      <h5>Tweaks</h5>
      <div class="tweaks-row">
        <span>Accent</span>
        <div class="seg" data-key="accent">
          <button data-v="gold">Gold</button>
          <button data-v="red">Red</button>
          <button data-v="teal">Teal</button>
        </div>
      </div>
      <div class="tweaks-row">
        <span>Motion</span>
        <div class="seg" data-key="motion">
          <button data-v="on">On</button>
          <button data-v="off">Off</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelectorAll('.seg').forEach((seg) => {
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          state[key] = b.dataset.v;
          updateButtons();
          applyState();
          try {
            window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: state[key] } }, '*');
          } catch (_) {}
        });
      });
    });

    updateButtons();
    return panel;
  }

  function updateButtons() {
    if (!panel) return;
    panel.querySelectorAll('.seg').forEach((seg) => {
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('on', b.dataset.v === state[key]);
      });
    });
  }

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') {
      buildPanel().classList.add('on');
    } else if (d.type === '__deactivate_edit_mode') {
      if (panel) panel.classList.remove('on');
    }
  });

  applyState();
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}
})();
