/* EDIO — Homepage choreography
   Intro boot → repair scan → cursor parallax → pinned story (repair → capture → data) → bench case study.
   GSAP + ScrollTrigger drive everything; CSS handles the cheap per-marker states. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays, header } = window.EDIO; // site.js: header, menu, helpers

  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('is-intro'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const hero = $('[data-hero]');
  const scene = $('[data-scene]');
  const heroPlates = $$('[data-plate]', hero);
  const pxLayers = $$('[data-px]', hero);
  const pxBg = $('.px-bg'), pxOv = $('.px-ov'), pxLb = $('.px-lb');
  const traceBase = $('.traces-base');
  const traceDraw = $('.traces-base use:first-child');
  const markers = $$('[data-mk]', hero).map(el => ({ el, left: parseFloat(el.style.left) / 100, x: 0, hit: false }));
  const scanEl = $('[data-scan]');
  const scanTag = $('.scan-tag', scanEl);
  const title = $('.hero-title');
  const titleWords = split(title);
  const heroCopy = $('[data-hero-copy]');
  const heroCta = $('[data-hero-cta]');
  const sub = $('.hero-sub');
  const ctas = $$('.hero-cta .btn');
  const sys = $('[data-sys]');
  const sysStatus = $('[data-sys-status]');
  const meta = $$('.hero-meta > *');
  const cue = $('[data-cue]');
  const steps = $$('[data-steps] li');
  const caps = $$('[data-cap]');
  const caseEl = $('[data-case]');
  const caseRows = $$('.case-head, .case-row', caseEl);
  const dataset = $('[data-dataset]');
  const leader = $('[data-leader] path');

  /* ---------- Dataset tiles ---------- */
  const TILE_COUNT = 35, TARGET = 17, HOT = [3, 9, 12, 23, 30, 33];
  for (let i = 0; i < TILE_COUNT; i++) {
    const t = document.createElement('i');
    t.className = 'tile' + (HOT.includes(i) || i === TARGET ? ' is-hot' : '');
    dataset.appendChild(t);
  }
  const tiles = $$('.tile', dataset);
  const targetTile = tiles[TARGET];
  const coldTiles = tiles.filter((t, i) => i !== TARGET && !HOT.includes(i));
  const hotTiles = HOT.map(i => tiles[i]);
  // order cold tiles by distance from the target so the grid grows out of the case
  const tcol = TARGET % 7, trow = Math.floor(TARGET / 7);
  coldTiles.sort((a, b) => {
    const d = el => { const i = tiles.indexOf(el); return Math.hypot(i % 7 - tcol, Math.floor(i / 7) - trow); };
    return d(a) - d(b);
  });

  /* ---------- Cover layout with a focal point ---------- */
  const BLEED = 40;
  const HERO_IMG = { w: 1672, h: 941, fx: 980 / 1672, fy: 574 / 941 };  // the board under the iron
  const BENCH_IMG = { w: 1254, h: 1254 };
  const heroGeom = { l: 0, t: 0, w: 1, h: 1, fx: 0, fy: 0, W: 1, H: 1 };

  function cover(boxW, boxH, img, zoom, tx, ty) {
    const s = Math.max(boxW / img.w, boxH / img.h) * zoom;
    const w = img.w * s, h = img.h * s;
    const l = Math.min(0, Math.max(boxW - w, tx * boxW - img.fx * w));
    const t = Math.min(0, Math.max(boxH - h, ty * boxH - img.fy * h));
    return { l, t, w, h };
  }
  const applyPlate = (el, g) => { el.style.cssText = `left:${g.l}px;top:${g.t}px;width:${g.w}px;height:${g.h}px`; };

  function layoutHero() {
    const W = hero.clientWidth, H = hero.clientHeight;
    const mobile = W < 768, tablet = W < 1200;
    const zoom = mobile ? 1.28 : tablet ? 1.16 : 1.1;
    const tx = mobile ? .56 : tablet ? .66 : .64;
    const ty = mobile ? .5 : .6;
    const bw = W + BLEED * 2, bh = H + BLEED * 2;
    const g = cover(bw, bh, HERO_IMG, zoom, (tx * W + BLEED) / bw, (ty * H + BLEED) / bh);
    heroPlates.forEach(p => applyPlate(p, g));
    Object.assign(heroGeom, g, {
      W, H,
      fx: g.l - BLEED + HERO_IMG.fx * g.w,
      fy: g.t - BLEED + HERO_IMG.fy * g.h
    });
    markers.forEach(m => { m.x = g.l - BLEED + m.left * g.w; });
    // labels that would sit under the headline stay quiet until the copy scrolls away
    const tr = title.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    markers.forEach(m => {
      const x = m.x, y = g.t - BLEED + parseFloat(m.el.style.top) / 100 * g.h;
      const lw = m.el.querySelector('.mk-label').offsetWidth + 24;
      const reach = m.el.classList.contains('mk--left') ? -lw : lw;
      const x0 = Math.min(x, x + reach), x1 = Math.max(x, x + reach);
      const under = x0 < tr.right - hr.left + 24 && x1 > tr.left - hr.left &&
                    y > tr.top - hr.top - 40 && y < tr.bottom - hr.top + 40;
      m.el.classList.toggle('is-occluded', under);
      m.el.classList.toggle('is-clipped', x0 < 0 || x1 > W);
    });
    gsap.set(scene, { transformOrigin: `${heroGeom.fx}px ${heroGeom.fy}px` });
    drawLeader();
  }

  function drawLeader() {
    const fx = heroGeom.fx, fy = heroGeom.fy;
    const cl = caseEl.offsetLeft, ct = caseEl.offsetTop, cw = caseEl.offsetWidth, ch = caseEl.offsetHeight;
    let d;
    if (fx > cl + cw) {            // board to the right of the card
      const y = ct + Math.min(ch - 24, 44), mx = cl + cw + (fx - cl - cw) * .45;
      d = `M${fx} ${fy} H${mx} V${y} H${cl + cw}`;
    } else if (fx < cl) {          // board to the left
      const y = ct + 44, mx = fx + (cl - fx) * .55;
      d = `M${fx} ${fy} H${mx} V${y} H${cl}`;
    } else {                       // board below the card
      const x = Math.min(Math.max(fx, cl + 24), cl + cw - 24);
      d = `M${fx} ${fy} V${(fy + ct + ch) / 2} H${x} V${ct + ch}`;
    }
    leader.setAttribute('d', d);
  }

  const bench = $('[data-bench]');
  const benchMedia = $('[data-bench-media]');
  const panels = $$('[data-panel]', bench).map(el => {
    const [x, y, w, h] = el.dataset.q.split(' ').map(Number);
    const [fx, fy] = el.dataset.f.split(' ').map(Number);
    const a = $('[data-anno]', el);
    return { el, plate: $('[data-panel-plate]', el), x, y, w, h, fx, fy,
             ax: parseFloat(a.style.left) / 100, ay: parseFloat(a.style.top) / 100 };
  });
  const panelPlates = panels.map(p => p.plate);
  // cover a panel with one quadrant of the collage; the plate is the whole image, offset so the crop fills the box
  function layoutBench() {
    panels.forEach(p => {
      const W = p.el.clientWidth, H = p.el.clientHeight;
      const s = Math.max(W / p.w, H / p.h) * 1.02;
      const qw = p.w * s, qh = p.h * s;
      const ql = Math.min(0, Math.max(W - qw, W / 2 - p.fx * qw));
      const qt = Math.min(0, Math.max(H - qh, H / 2 - p.fy * qh));
      const size = BENCH_IMG.w * s;
      applyPlate(p.plate, { l: ql - p.x * s, t: qt - p.y * s, w: size, h: size });
      gsap.set(p.plate, { transformOrigin: `${p.ax * size}px ${p.ay * size}px` }); // zoom toward the annotation
    });
  }

  function layout() { layoutHero(); layoutBench(); }
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ==========================================================================
     INTRO — the system coming online (~2.8s, never blocks input)
     ========================================================================== */
  const scanState = { p: 0 };
  let scanTl = null;

  function runIntro(onDone) {
    const skip = reduceMQ.matches || window.scrollY > window.innerHeight * .4;
    html.classList.remove('is-intro');
    if (skip) { sysStatus.textContent = 'Online'; onDone(); return; }

    const W = heroGeom.W;
    const wipe = { v: 100 };
    gsap.set([header, sub, ...ctas, ...meta, sys], { opacity: 0 });
    gsap.set(titleWords, { yPercent: 105 });
    gsap.set('.fl-h', { scaleX: 0 });
    gsap.set('.fl-v', { scaleY: 0 });
    gsap.set(scene, { clipPath: 'inset(0 0 0 100%)' });
    gsap.set(pxBg, { scale: 1.06 });
    gsap.set(traceDraw, { strokeDashoffset: 900 });
    gsap.set(sub, { y: 14 });
    gsap.set(ctas, { y: 12 });

    const delays = lineDelays(titleWords);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: onDone });

    tl.to(sys, { opacity: 1, duration: .35 }, .05)
      .fromTo(sysStatus, { opacity: .25 }, { opacity: 1, duration: .16, repeat: 4, yoyo: true, ease: 'steps(1)' }, .2) // even repeat → settles bright
      .to('.fl-h', { scaleX: 1, duration: 1.15, stagger: .12, ease: 'expo.inOut' }, .25)
      .to('.fl-v', { scaleY: 1, duration: 1.15, stagger: .08, ease: 'expo.inOut' }, .35)
      // cyan edge wipes the bench into view, right → left
      .to(scanEl, { opacity: .9, duration: .2 }, .7)
      .to(wipe, {
        v: 0, duration: 1.25, ease: 'expo.inOut',
        onUpdate() {
          scene.style.clipPath = `inset(0 0 0 ${wipe.v}%)`;
          gsap.set(scanEl, { x: W * wipe.v / 100 });
        }
      }, .7)
      .to(scanEl, { opacity: 0, duration: .3 }, 1.8)
      .to(pxBg, { scale: 1, duration: 2, ease: 'power2.out' }, .7)
      .to(traceDraw, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 1.15)
      .to(header, { opacity: 1, duration: .8 }, 1.45)
      .to(titleWords, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: i => delays[i] }, 1.45)
      .to(sub, { opacity: 1, y: 0, duration: .8 }, 1.95)
      .to(ctas, { opacity: 1, y: 0, duration: .7, stagger: .08 }, 2.1)
      .call(() => { sysStatus.textContent = 'Online'; }, null, 2.0)
      .to(meta, { opacity: 1, duration: .6, stagger: .08 }, 2.35)
      .add(() => gsap.set(scene, { clearProps: 'clipPath' }));
  }

  /* ==========================================================================
     REPAIR SCAN — periodic cyan pass; traces light, markers wake, image sharpens
     ========================================================================== */
  function setScan(x) {
    gsap.set(scanEl, { x });
    const p = (x + BLEED - heroGeom.l) / heroGeom.w * 100;
    hero.style.setProperty('--scanp', p.toFixed(2) + '%');
    scanTag.textContent = 'Scan · ' + String(Math.round(scanState.p * 100)).padStart(3, '0');
    for (const m of markers) {
      if (!m.hit && x >= m.x) {
        m.hit = true;
        m.el.classList.add('is-hit');
        gsap.delayedCall(1.5, () => m.el.classList.remove('is-hit'));
      }
    }
  }

  function buildScan(mobile) {
    const dur = mobile ? 2.8 : 2.3;
    return gsap.timeline({ repeat: -1, repeatDelay: mobile ? 11 : 6, paused: true })
      .call(() => markers.forEach(m => { m.hit = false; }))
      .to(scanEl, { opacity: .85, duration: .25 }, 0)
      .fromTo(scanState, { p: 0 }, {
        p: 1, duration: dur, ease: 'sine.inOut',
        onUpdate: () => setScan(-0.03 * heroGeom.W + scanState.p * 1.06 * heroGeom.W)
      }, 0)
      .to(scanEl, { opacity: 0, duration: .3 }, dur - .3)
      .call(() => hero.style.setProperty('--scanp', '-20%'));
  }

  /* ==========================================================================
     SCROLL + PARALLAX (rebuilt per breakpoint)
     ========================================================================== */
  function buildStory({ mobile, reduce }) {
    const z1 = reduce ? 1 : 1.08, z2 = reduce ? 1 : (mobile ? 1.18 : 1.24);
    const lift = reduce ? 0 : -120;

    let phase = -1;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      // read the scrubbed playhead (not raw scroll) so the index never lags the scene
      onUpdate() {
        const t = tl.time();
        const p = t < 3.2 ? 0 : t < 5.8 ? 1 : 2;
        if (p !== phase) { phase = p; steps.forEach((s, i) => s.classList.toggle('is-on', i === p)); }
      },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (mobile ? 2.4 : 3)),
        pin: true,
        scrub: mobile ? .4 : .7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          if (scanTl) {
            const active = self.progress < .06;
            if (active && scanTl.paused()) scanTl.play();
            if (!active && !scanTl.paused()) { scanTl.pause(0); scanEl.style.opacity = 0; hero.style.setProperty('--scanp', '-20%'); }
          }
        }
      }
    });

    // --- 01 Physical repair: the hero hands over to the bench ---
    tl.to(heroCopy, { y: lift, duration: 2.2, ease: 'power1.in' }, 0)
      .to(heroCopy, { opacity: 0, duration: 1.4 }, .6)
      .to(heroCta, { opacity: 0, duration: .7 }, 0)
      .fromTo([sys, cue], { opacity: 1 }, { opacity: 0, duration: .6, immediateRender: false }, 0)
      .to(scene, { scale: z1, duration: 2.2 }, 0)
      .to(traceBase, { opacity: 1, duration: 1.6 }, .2)
      .to(hero, { '--on': 1, duration: .9 }, 1)
      .fromTo(caps[0], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 1.5)
      .to(scene, { scale: z2, duration: 1.2, ease: 'power1.inOut' }, 2.2)

    // --- 02 Captured information: the repair becomes a case ---
      .to(caps[0], { opacity: 0, y: -16, duration: .5 }, 3.1)
      .to(hero, { '--on': 0, duration: .5 }, 3.1)
      .to(pxLb, { opacity: .0, duration: .5 }, 3.1)
      .to(pxBg, { opacity: .38, duration: 1 }, 3.1)
      .to(traceBase, { opacity: .55, duration: 1 }, 3.1)
      .fromTo(leader, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' }, 3.3)
      .fromTo(caseEl, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, 3.7)
      .fromTo(caseRows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .35, stagger: .18, ease: 'power2.out' }, 3.9)
      .fromTo(caps[1], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 3.6)

    // --- 03 Structured data: one case, one tile, a growing dataset ---
      .to(caps[1], { opacity: 0, y: -16, duration: .5 }, 5.6)
      .to(caseRows, { opacity: 0, duration: .35, stagger: .04 }, 5.6)
      .to(leader, { strokeDashoffset: 1, duration: .5 }, 5.6)
      .to(caseEl, {
        x: () => dataset.offsetLeft + targetTile.offsetLeft - caseEl.offsetLeft,
        y: () => dataset.offsetTop + targetTile.offsetTop - caseEl.offsetTop,
        scaleX: () => targetTile.offsetWidth / caseEl.offsetWidth,
        scaleY: () => targetTile.offsetHeight / caseEl.offsetHeight,
        duration: 1.1, ease: 'power3.inOut'
      }, 6.0)
      .to(pxBg, { opacity: .1, duration: 1.2 }, 6.0)
      .to(pxOv, { opacity: .15, duration: 1.2 }, 6.0)
      .fromTo(coldTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .03 }, 6.5)
      .fromTo(targetTile, { opacity: 0 }, { opacity: 1, duration: .2 }, 7.05)
      .to(caseEl, { opacity: 0, duration: .2 }, 7.1)
      .fromTo(hotTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, 7.3)
      .fromTo(caps[2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 6.3)
      .to({}, { duration: .8 }, 8.2); // hold

    return tl;
  }

  function buildBench({ mobile, reduce }) {
    const annos = $$('[data-anno]', bench);
    const lines = $$('[data-anno-line]', bench);
    const labels = $$('[data-anno-label]', bench);
    const index = $$('[data-index] li', bench);
    const benchWords = split($('.bench-title', bench));
    const delays = lineDelays(benchWords, .08, .02);

    // headline reveal (once, not scrubbed)
    if (!reduce) {
      gsap.set(benchWords, { yPercent: 105 });
      ScrollTrigger.create({
        trigger: bench, start: 'top 70%', once: true,
        onEnter: () => gsap.to(benchWords, { yPercent: 0, duration: 1, ease: 'expo.out', delay: i => delays[i] })
      });
    }

    // pin only when the whole case study fits on screen (stacked tablet layouts often don't)
    const fits = bench.offsetHeight <= window.innerHeight + 1;
    const st = (mobile || !fits)
      ? { trigger: '[data-bench-frame]', start: 'top 85%', end: 'bottom 30%', scrub: .4 }
      : { trigger: bench, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 1.3), pin: true, scrub: .7, anticipatePin: 1 };

    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st });
    tl.fromTo(benchMedia, { clipPath: reduce ? 'inset(0% 0% 0% 0%)' : 'inset(7% 9% 7% 9%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.out' }, 0)
      .fromTo(panelPlates, { scale: 1 }, { scale: reduce ? 1 : 1.08, duration: 4 }, 0);

    annos.forEach((a, i) => {
      const at = .8 + i * .7;
      tl.fromTo(panels[i].el, { '--shade': reduce ? 0 : .55 }, { '--shade': 0, duration: .5, ease: 'power2.out' }, at - .1)
        .fromTo(a, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .25, ease: 'back.out(2)' }, at)
        .fromTo(lines[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, at + .15)
        .fromTo(labels[i], { opacity: 0 }, { opacity: 1, duration: .25 }, at + .45)
        .fromTo(index[i], { opacity: .3, '--fill': 0 }, { opacity: 1, '--fill': 1, duration: .4 }, at + .3);
    });
    tl.to({}, { duration: .4 });
    return tl;
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
      tx(-nx * 6); ty(-ny * 6);   // 3px each way
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set([...pxLayers, title], { x: 0, y: 0 });
    };
  }

  runIntro(() => {
    const mm = gsap.matchMedia();
    mm.add({
      mobile: '(max-width: 767px)',
      desktop: '(min-width: 768px)',
      reduce: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)'
    }, ctx => {
      const { mobile, reduce, fine } = ctx.conditions;
      layout();
      buildStory({ mobile, reduce });
      buildBench({ mobile, reduce });

      if (!reduce) {
        scanTl = buildScan(mobile);
        if (window.scrollY < 40) scanTl.play();
      }
      const killParallax = (!reduce && fine && !mobile) ? buildParallax() : null;

      return () => {
        if (scanTl) { scanTl.kill(); scanTl = null; }
        if (killParallax) killParallax();
        hero.style.setProperty('--scanp', '-20%');
      };
    });
  });
})();
