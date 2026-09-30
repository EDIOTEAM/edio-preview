/* EDIO — Homepage sections 04–09 (after the hero story); the SmartClone showcase now lives on products.html.
   Kept separate from home.js so the approved hero is never affected.
   Sections 04–06 play on their own, like short clips: each starts when it comes on screen, pauses while
   off screen, plays once and holds its last frame, then offers a replay. Scrolling never drives them,
   so nothing here interferes with the hero's pinned story. Works without GSAP. */
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
     04 Scattered fragments: they arrive one by one from far apart, then the broken links appear
     ========================================================================== */
  const problem = $('[data-problem]');
  const scatter = $('[data-scatter]');
  const frags = $$('[data-frag]');
  frags.forEach(f => f.addEventListener('pointermove', e => {
    const r = f.getBoundingClientRect();
    f.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    f.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
  const drift = [[-18, -12], [20, -16], [-16, 14], [18, 12]];
  function paintProblem(p) {
    const wide = window.innerWidth >= 768;
    frags.forEach((f, i) => {
      const k = ease(step(p, .06 + i * .17, .3));
      const [dx, dy] = wide ? drift[i].map(v => v * 6 * (1 - k)) : [0, 28 * (1 - k)];
      f.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      f.style.opacity = k.toFixed(3);
      // a brief glow as each fragment lands
      f.classList.toggle('is-lit', k > .6 && step(p, .06 + i * .17, .44) < 1);
    });
    scatter.classList.toggle('is-linked', p >= .86);
  }
  const problemClip = problem && scatter && clip({ section: problem, watch: scatter, duration: 4200, paint: paintProblem, replayIn: problem });

  /* ==========================================================================
     05 Map: inputs connect one by one, EDIO merges them, stages run, the record fills
     ========================================================================== */
  const flow = $('[data-flow]');
  const map = $('[data-map]');
  const svg = $('[data-map-wires]');
  const srcs = $$('[data-src]', map);
  const core = $('[data-core]', map);
  const coreCount = $('[data-core-count]', map);
  const stages = $$('[data-stage]', map);
  const fields = $$('[data-field]');
  const recState = $('[data-rec-state]');
  const NS = 'http://www.w3.org/2000/svg';
  let wires = [];   // { live, pkt, len }

  function buildWires() {
    svg.innerHTML = '';
    wires = [];
    if (getComputedStyle(svg).display === 'none') return;
    const m = map.getBoundingClientRect();
    const R = el => { const r = el.getBoundingClientRect(); return { l: r.left - m.left, r: r.right - m.left, t: r.top - m.top, b: r.bottom - m.top, cy: (r.top + r.bottom) / 2 - m.top }; };
    const c = R(core);
    const busX = (R(srcs[0]).r + c.l) / 2;
    const paths = srcs.map(s => { const a = R(s); return `M${a.r} ${a.cy} H${busX} V${c.cy} H${c.l}`; });
    // core → first stage, then stage to stage along the row
    const st = stages.map(R);
    paths.push(`M${c.r} ${c.cy} H${st[0].l}`);
    for (let i = 0; i < st.length - 1; i++) paths.push(`M${st[i].r} ${st[i].t + 34} H${st[i + 1].l}`);
    paths.forEach(d => {
      const base = document.createElementNS(NS, 'path'); base.setAttribute('d', d); base.setAttribute('class', 'w-base');
      const live = document.createElementNS(NS, 'path'); live.setAttribute('d', d); live.setAttribute('class', 'w-live');
      const pkt = document.createElementNS(NS, 'circle'); pkt.setAttribute('r', 3.5); pkt.setAttribute('class', 'pkt'); pkt.style.opacity = 0;
      svg.append(base, live, pkt);
      const len = live.getTotalLength();
      live.style.strokeDasharray = len; live.style.strokeDashoffset = len;
      wires.push({ live, pkt, len });
    });
  }
  // draw wire i to fraction f, with a packet riding its tip
  function drawWire(i, f) {
    const w = wires[i]; if (!w) return;
    w.live.style.strokeDashoffset = w.len * (1 - f);
    const show = f > 0 && f < 1;
    w.pkt.style.opacity = show ? 1 : 0;
    if (show) { const p = w.live.getPointAtLength(w.len * f); w.pkt.setAttribute('cx', p.x); w.pkt.setAttribute('cy', p.y); }
  }
  const RECORD_AT = [[0], [1, 2], [3], [4]];   // which record fields each stage fills
  function paintFlow(p) {
    // inputs: one every .10 of the clip
    let merged = 0;
    srcs.forEach((s, i) => {
      const f = step(p, i * .1, .08);
      s.classList.toggle('is-on', f > 0);
      drawWire(i, f);
      if (f >= 1) merged++;
    });
    coreCount.textContent = merged + ' / 4 inputs' + (merged === 4 ? ' · merged' : '');
    core.classList.toggle('is-full', merged === 4);
    core.style.setProperty('--glow', step(p, .3, .14).toFixed(3));
    // stages: from .46, one every .11
    stages.forEach((s, i) => {
      const f = step(p, .46 + i * .11, .07);
      drawWire(4 + i, f);
      s.classList.toggle('is-on', f >= 1);
    });
    let filled = 0;
    stages.forEach((s, i) => RECORD_AT[i].forEach(k => {
      const on = s.classList.contains('is-on');
      fields[k].classList.toggle('is-on', on);
      if (on) filled++;
    }));
    recState.textContent = merged < 4 ? 'waiting for inputs · ' + merged + ' / 4'
      : filled === 0 ? 'merging inputs'
      : filled < 5 ? 'forming · ' + filled + ' / 5 fields' : 'validated · reusable';
  }
  // hover an input: its path lights up
  srcs.forEach((s, i) => {
    s.addEventListener('pointerenter', () => { s.classList.add('is-hot'); if (wires[i]) wires[i].live.style.stroke = 'var(--cyan-2)'; });
    s.addEventListener('pointerleave', () => { s.classList.remove('is-hot'); if (wires[i]) wires[i].live.style.stroke = ''; });
  });
  // wires are measured from the laid-out map, so wait for fonts before the clip can start
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const flowClip = clip({
    section: flow, watch: map, duration: 4200, paint: paintFlow, replayIn: flow,
    ready: fontsReady.then(() => { buildWires(); if (flowClip) flowClip.repaint(); }),
  });

  /* ==========================================================================
     06 Timeline: the rail fills and categories light in turn; clicking a node jumps there
     ========================================================================== */
  const cats = $('[data-cats]');
  const tlFill = $('[data-tl-fill]');
  const tlItems = $$('[data-tl-item]');
  function paintTl(p) {
    const q = clamp(p / .85);
    tlFill.style.setProperty('--p', q.toFixed(3));
    tlItems.forEach((it, i) => it.classList.toggle('is-on', q >= i / 3 - .001));
  }
  const tlClip = clip({ section: cats, watch: $('[data-tl]', cats), duration: 5200, paint: paintTl, replayIn: cats });
  $$('[data-tl-node]').forEach((n, i) => n.addEventListener('click', () => tlClip.hold((i / 3) * .85)));

  /* ==========================================================================
     Layout changes: re-measure the map wires and repaint where each clip is
     ========================================================================== */
  let resizing = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizing);
    resizing = requestAnimationFrame(() => { buildWires(); flowClip.repaint(); if (problemClip) problemClip.repaint(); });
  });
  window.addEventListener('load', () => { buildWires(); flowClip.repaint(); });
})();
