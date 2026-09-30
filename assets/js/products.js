/* EDIO — Products page: SmartClone in 3D and the EDIO App (moved from the homepage, formerly section 07).
   The heading types in when it comes into view; the device gives a short guided tour of its markers once on
   screen, then rests; dragging takes over. Works without GSAP. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  // progress of a step that runs from `at` for `len` of the clip, 0 → 1
  const step = (p, at, len) => clamp((p - at) / len);

  /* ==========================================================================
     Typewriter headings: letters type in when the heading comes into view
     ========================================================================== */
  const typers = $$('[data-type]').map(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => `<span class="tw-w" aria-hidden="true">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ');
    return { el, chars: $$('.ch', el), done: false };
  });
  const afterOf = el => $$('[data-type-after]', el.closest('section') || document);

  function type(t) {
    if (t.done) return; t.done = true;
    if (reduce) { t.chars.forEach(c => c.classList.add('on')); afterOf(t.el).forEach(a => a.classList.add('is-in')); return; }
    const per = 26;
    t.chars.forEach((c, i) => setTimeout(() => {
      c.classList.add('on');
      if (i) t.chars[i - 1].classList.remove('is-caret');
      c.classList.add('is-caret');
    }, i * per));
    const end = t.chars.length * per;
    setTimeout(() => { t.el.classList.add('is-typed'); afterOf(t.el).forEach(a => a.classList.add('is-in')); }, end + 80);
    setTimeout(() => t.chars.forEach(c => c.classList.remove('is-caret')), end + 1500);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const t = typers.find(x => x.el === e.target); if (t) type(t); io.unobserve(e.target);
    }), { threshold: .6 });
    typers.forEach(t => io.observe(t.el));
  } else typers.forEach(type);

  /* ==========================================================================
     Clip player: time drives paint(p), p = 0 → 1 over `duration` ms
     ========================================================================== */
  function clip({ section, watch = section, duration, paint, replayIn, onEnd, ready = Promise.resolve() }) {
    const c = { p: 0, playing: false, visible: false, done: false, started: false };
    let raf = 0, last = 0, btn = null;

    if (replayIn && !reduce) {
      btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'replay'; btn.tabIndex = -1;
      btn.innerHTML = '<i aria-hidden="true">↻</i>Replay';
      btn.addEventListener('click', () => c.restart());
      replayIn.append(btn);
    }
    const setPlayed = on => {
      section.classList.toggle('is-played', on);
      if (btn) btn.tabIndex = on ? 0 : -1;
    };
    function tick(now) {
      raf = 0;
      if (!c.playing || !c.visible) return;
      // cap the step so a stalled tab resumes where it left off instead of jumping to the end
      c.p = clamp(c.p + Math.min(250, now - last) / duration);
      last = now;
      paint(c.p);
      if (c.p >= 1) { c.playing = false; c.done = true; setPlayed(true); if (onEnd) onEnd(); return; }
      raf = requestAnimationFrame(tick);
    }
    const resume = () => { if (!raf && c.playing && c.visible) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    c.play = () => { if (c.done) return; c.started = true; c.playing = true; resume(); };
    c.restart = () => { c.p = 0; c.done = false; setPlayed(false); paint(0); c.play(); };
    // jump to p and hold there (e.g. a timeline node was clicked)
    c.hold = p => { c.stop(); c.p = clamp(p); paint(c.p); };
    // end here without repainting (the visitor has taken over)
    c.stop = () => { c.playing = false; c.done = true; c.started = true; setPlayed(true); };
    c.repaint = () => paint(c.p);

    if (reduce) { c.done = true; paint(1); if (onEnd) onEnd(); return c; }
    paint(0);
    if (!('IntersectionObserver' in window)) { c.visible = true; ready.then(c.play); return c; }
    // "on screen" = some of the animated part is inside the top three quarters of the viewport
    new IntersectionObserver(es => es.forEach(e => {
      c.visible = e.isIntersecting;
      if (!c.visible) return;
      if (!c.started) ready.then(() => { if (!c.started) c.play(); });
      else resume();
    }), { rootMargin: '0px 0px -25% 0px', threshold: 0 }).observe(watch);
    return c;
  }


  /* ==========================================================================
     SmartClone: a guided tour of the device, then it rests; tilt toward the cursor (as on edio.in)
     ========================================================================== */
  const products = $('[data-products]');
  const stage = $('[data-scx]');
  const tilt = $('[data-scx-tilt]');
  const float = $('[data-scx-float]');
  const model = $('[data-scx-model]');
  if (stage && !reduce) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      tilt.style.setProperty('--ry', (nx * 8).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-ny * 6).toFixed(2) + 'deg');
    });
    stage.addEventListener('pointerleave', () => { tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); });
  }
  if (products && model) {
    // the still render stays until the 3D model has actually drawn
    const modelReady = new Promise(r => {
      if (model.loaded) return r(true);
      model.addEventListener('load', () => r(true), { once: true });
      model.addEventListener('error', () => r(false), { once: true });
    });
    modelReady.then(ok => { if (ok) float.classList.add('is-live'); });

    // tour order runs left to right across the faceplate
    const TOUR = ['hotspot-prog', 'hotspot-screen', 'hotspot-keys', 'hotspot-status', 'hotspot-ir', 'hotspot-iface'];
    const hots = TOUR.map(s => $(`[slot="${s}"]`, model)).filter(Boolean);
    const REST = { theta: -18, phi: 52 };
    const LEAD = .06, TAIL = .1;   // a beat before the first marker, and time to settle after the last
    let lastHot = -1;
    const orbit = (theta, phi) => model.setAttribute('camera-orbit', `${theta.toFixed(2)}deg ${phi.toFixed(2)}deg 78%`);
    function paintTour(p) {
      // camera sways gently across the device and comes back to rest
      const sway = Math.sin(clamp(p / (1 - TAIL)) * Math.PI * 2);
      const lift = Math.sin(clamp(p / (1 - TAIL)) * Math.PI);
      orbit(REST.theta + sway * 16, REST.phi - lift * 8);
      const k = (p - LEAD) / (1 - LEAD - TAIL);
      const i = k >= 0 && k < 1 ? Math.floor(k * hots.length) : -1;
      if (i === lastHot) return;
      lastHot = i;
      hots.forEach((h, j) => h.classList.toggle('is-on', j === i));
    }
    const tour = clip({
      section: products, watch: stage, duration: hots.length * 2400 + 1400, paint: paintTour,
      replayIn: stage,
      // without a 3D model there is nothing to tour: never start
      ready: modelReady.then(ok => ok || new Promise(() => {})),
    });
    // the visitor takes over: stop the tour and leave the camera where they put it
    model.addEventListener('camera-change', e => {
      if (!e.detail || e.detail.source !== 'user-interaction' || tour.done) return;
      tour.stop();
      hots.forEach(h => h.classList.remove('is-on'));
      lastHot = -1;
    });
  }

})();
