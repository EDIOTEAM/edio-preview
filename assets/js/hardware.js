/* EDIO — Hardware page choreography
   Instrument intro → spec markers → cursor parallax → symptom-driven mode stage → case timer → process rail.
   Content lives in the HTML; this file only stages it. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays, revealHeadings, header } = window.EDIO;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Hex viewer illustration (static bytes; one highlighted) ---------- */
  const hexEl = $('[data-hex]');
  if (hexEl) {
    const bytes = '4E 54 36 34 00 02 1F A0 80 01 00 00 3C 3C 10 08 FF 00 7E 12 40 C8 02 00 00 00 11 22 5A A5 0F F0 20 21 00 01 02 04 08 10 E0 F8 7C 3E 00 00 00 01 55 AA 00 FF 13 37 C0 DE 00 00 00 00 00 00 00 00'.split(' ');
    let out = '';
    for (let r = 0; r < 8; r++) {
      out += `<span class="a">${(r * 8).toString(16).toUpperCase().padStart(4, '0')}</span>`;
      for (let c = 0; c < 8; c++) out += `<span${r === 0 && c === 5 ? ' class="hi"' : ''}>${bytes[r * 8 + c]}</span>`;
    }
    hexEl.innerHTML = out;
  }

  /* ---------- Mode stage (works with or without GSAP) ---------- */
  const modesBody = $('[data-modes-body]');
  const modes = $$('[data-mode]', modesBody);
  const picks = modes.map(m => $('[data-mode-pick]', m));
  const details = modes.map(m => $('[data-mode-detail]', m));
  const modesFill = $('[data-modes-fill]');
  const modesCount = $('[data-modes-count]');
  const N = modes.length;
  let current = 0, stage = false, modesST = null;

  function setMode(i, force) {
    if (i === current && !force) return;
    current = i;
    modes.forEach((m, k) => {
      const on = k === i;
      m.classList.toggle('is-on', on);
      picks[k].setAttribute('aria-pressed', String(on));
      if (stage) details[k].inert = !on; else details[k].inert = false;
    });
    modesCount.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
  }
  function setStage(on) {
    stage = on;
    modesBody.classList.toggle('is-stage', on);
    picks.forEach(p => { if (on) p.removeAttribute('tabindex'); else p.setAttribute('tabindex', '-1'); });
    if (!on) { picks.forEach(p => { p.removeAttribute('aria-pressed'); p.style.removeProperty('--p'); }); details.forEach(d => { d.inert = false; }); }
    else setMode(current, true);
  }
  picks.forEach((p, i) => {
    p.addEventListener('click', () => {
      if (!stage) return;
      if (modesST) {
        const top = modesST.start + (i + .5) / N * (modesST.end - modesST.start);
        window.scrollTo({ top, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      } else {
        setMode(i);
      }
    });
    p.addEventListener('keydown', e => {
      if (!stage || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      const j = (i + (e.key === 'ArrowDown' ? 1 : -1) + N) % N;
      picks[j].focus(); picks[j].click();
    });
  });

  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.remove('is-intro');
    const wide = window.matchMedia('(min-width: 1024px)');
    const apply = () => setStage(wide.matches);
    apply(); wide.addEventListener('change', apply);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Hero plate layout: put the device where the layout needs it ---------- */
  const hero = $('[data-hw-hero]');
  const scene = $('[data-hw-scene]');
  const plates = $$('[data-hw-plate]', hero);
  const pxLayers = $$('[data-px]', hero);
  const markers = $$('[data-mk]', hero);
  const title = $('.hw-title', hero);
  const titleWords = split(title);
  const IMG = { w: 1586, h: 992, fx: 435 / 1586, fy: 430 / 992 };  // SmartClone's display
  const BLEED = 40;
  let focal = { x: 0, y: 0 };

  function layoutHero() {
    const W = hero.clientWidth, H = hero.clientHeight;
    // stacked (phones, portrait tablets): device under the copy. Side-by-side otherwise:
    // device right of the copy with dark bench around it for callouts; photo edges fade into navy
    const stacked = W < 768 || (W < 1200 && H > W);
    const tx = stacked ? .5 : W < 1200 ? .7 : .645;
    const ty = stacked ? (W < 768 ? .7 : .72) : .5;
    const s = stacked ? W * (W < 768 ? .92 : .7) / 690 : Math.min(H / 1000, W * .44 / 690);
    const w = IMG.w * s, h = IMG.h * s;
    const l = tx * W - IMG.fx * w + BLEED, t = ty * H - IMG.fy * h + BLEED;  // plates live in the bled .px box
    plates.forEach(p => { p.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`; });
    focal = { x: tx * W, y: ty * H };
    gsap.set(scene, { transformOrigin: `${focal.x}px ${focal.y}px` });
    hero.style.setProperty('--k', (s / .9).toFixed(3));  // callout leaders were drawn at s = .9
    // hide callouts whose label would leave the frame
    markers.forEach(m => {
      const k = s / .9;
      const x = l - BLEED + parseFloat(m.style.left) / 100 * w + (+m.style.getPropertyValue('--dx') || 0) * k;
      const y = t - BLEED + parseFloat(m.style.top) / 100 * h + (+m.style.getPropertyValue('--dy') || 0) * k;
      const lw = $('.mk-label', m).offsetWidth + 24;
      m.classList.toggle('is-clipped', x + lw > W - 16 || x < 8 || y < header.offsetHeight + 64 || y > H - 24);
    });
  }
  function layout() { layoutHero(); }
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  /* ---------- Intro: the instrument powers on (~1.9s) ---------- */
  const sys = $('[data-sys]', hero);
  const fades = $$('[data-hero-fade]', hero);

  function runIntro(onDone) {
    const skip = reduceMQ.matches || window.scrollY > window.innerHeight * .4;
    html.classList.remove('is-intro');
    if (skip) { markers.forEach(m => m.classList.add('is-hit')); onDone(); return; }

    const wipe = { v: 100 };
    gsap.set([header, sys, ...fades], { opacity: 0 });
    gsap.set(titleWords, { yPercent: 105 });
    gsap.set('.hl-h', { scaleX: 0 });
    gsap.set('.hl-v', { scaleY: 0 });
    gsap.set(scene, { clipPath: 'inset(0 0 0 100%)' });
    gsap.set(pxLayers[0], { scale: 1.05 });
    fades.forEach(f => gsap.set(f, { y: 12 }));

    const delays = lineDelays(titleWords);
    gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: onDone })
      .to(sys, { opacity: 1, duration: .4 }, .05)
      .to('.hl-h', { scaleX: 1, duration: 1, ease: 'expo.inOut' }, .1)
      .to('.hl-v', { scaleY: 1, duration: 1, stagger: .08, ease: 'expo.inOut' }, .15)
      .to(wipe, { v: 0, duration: 1.1, ease: 'expo.inOut', onUpdate() { scene.style.clipPath = `inset(0 0 0 ${wipe.v}%)`; } }, .3)
      .to(pxLayers[0], { scale: 1, duration: 1.8, ease: 'power2.out' }, .3)
      .to(header, { opacity: 1, duration: .7 }, .8)
      .to(titleWords, { yPercent: 0, duration: 1, ease: 'expo.out', delay: i => delays[i] }, .75)
      .to(fades, { opacity: 1, y: 0, duration: .7, stagger: .08 }, 1.15)
      // spec callouts light one by one, left → right across the instrument
      .add(() => markers.forEach((m, i) => gsap.delayedCall(i * .16, () => m.classList.add('is-hit'))), 1.2)
      .add(() => gsap.set(scene, { clearProps: 'clipPath' }));
  }

  function buildParallax() {
    const layers = pxLayers.map(el => ({
      amt: +el.dataset.px,
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' })
    }));
    const tx = gsap.quickTo(title, 'x', { duration: 1.4, ease: 'power3' });
    const ty = gsap.quickTo(title, 'y', { duration: 1.4, ease: 'power3' });
    const onMove = e => {
      const nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
      layers.forEach(l => { l.x(-nx * 2 * l.amt); l.y(-ny * 2 * l.amt); });
      tx(-nx * 6); ty(-ny * 6);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); gsap.set([...pxLayers, title], { x: 0, y: 0 }); };
  }

  /* ---------- Mode stage pinning ---------- */
  function buildModes({ reduce }) {
    setStage(true);
    const headerH = header.offsetHeight;
    const fits = modesBody.offsetHeight + headerH + 96 <= window.innerHeight;
    if (!fits || reduce) { modesST = null; return; }

    modesST = ScrollTrigger.create({
      trigger: modesBody,
      start: () => `top ${headerH + 64}px`,
      end: () => '+=' + Math.round(window.innerHeight * .55 * N),
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      refreshPriority: 1, // measure the pin first so later triggers include its spacer
      snap: {
        snapTo: v => (v <= 0 || v >= 1) ? v : (Math.min(N - 1, Math.floor(v * N)) + .5) / N,
        duration: { min: .2, max: .5 }, delay: .12, ease: 'power1.inOut'
      },
      onUpdate(self) {
        const v = self.progress * N;
        const i = Math.min(N - 1, Math.floor(v));
        setMode(i);
        picks.forEach((p, k) => p.style.setProperty('--p', k < i ? 0 : k === i ? Math.min(1, v - i).toFixed(3) : 0));
        modesFill.style.setProperty('--p', self.progress.toFixed(4));
      }
    });
  }

  /* ---------- Case record: rows land while the timer runs to 7 s ---------- */
  function buildRecord(reduce) {
    const card = $('[data-record-card]');
    const rows = $$('[data-record-row]', card);
    const time = $('[data-record-time]', card);
    if (reduce) { time.textContent = '7.0'; return; }
    gsap.set(rows, { opacity: 0, x: -10 });
    const t = { v: 0 };
    ScrollTrigger.create({
      trigger: card, start: 'top 72%', once: true,
      onEnter: () => gsap.timeline()
        .to(rows, { opacity: 1, x: 0, duration: .45, stagger: .26, ease: 'power2.out' }, 0)
        .to(t, { v: 7, duration: 1.5, ease: 'power1.inOut', onUpdate: () => { time.textContent = t.v.toFixed(1); } }, 0)
    });
  }

  /* ---------- Process rail: the line fills, nodes activate as it reaches them ---------- */
  function buildRail(reduce) {
    const rail = $('[data-rail]');
    const fill = $('[data-rail-fill]');
    const steps = $$('[data-step]', rail);
    const line = $('.rail-line', rail);
    let marks = [];
    const measure = () => {
      const horiz = line.offsetWidth > line.offsetHeight;
      marks = steps.map(s => horiz ? s.offsetLeft / rail.offsetWidth : (s.offsetTop + 22) / rail.offsetHeight);
    };
    const paint = p => { fill.style.setProperty('--p', p.toFixed(4)); steps.forEach((s, i) => s.classList.toggle('is-on', p >= marks[i] - .001)); };
    measure();
    if (reduce) { paint(1); return; }
    ScrollTrigger.create({
      trigger: rail, start: 'top 72%', end: 'bottom 55%', scrub: .6,
      onRefresh: measure,
      onUpdate: self => paint(self.progress)
    });
    paint(0);
  }

  runIntro(() => {
    const reduce = reduceMQ.matches;
    revealHeadings(title, reduce);
    buildRecord(reduce);
    buildRail(reduce);

    const mm = gsap.matchMedia();
    mm.add({
      wide: '(min-width: 1024px)',
      mobile: '(max-width: 767px)',
      reduce: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)'
    }, ctx => {
      const { wide, mobile, reduce, fine } = ctx.conditions;
      layout();

      if (!reduce) {
        // hero hands over: instrument pushes in, copy lifts away
        gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: mobile ? .3 : .6 } })
          .to(scene, { scale: 1.08, ease: 'none' }, 0)
          .to('[data-hero-copy]', { y: mobile ? -40 : -110, opacity: .15, ease: 'power1.in' }, 0);
        // bench photo drifts inside its frame
        gsap.fromTo('[data-drift]', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.pro-media', start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      if (wide) buildModes({ reduce }); else setStage(false);
      const killParallax = (!reduce && fine && !mobile) ? buildParallax() : null;
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => {
        if (killParallax) killParallax();
        modesST = null;
        setStage(false);
      };
    });
  });
})();
