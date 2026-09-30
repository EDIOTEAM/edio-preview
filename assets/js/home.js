/* EDIO — Homepage choreography
   Intro (stage lights, device rises) → scan pass over the real SmartClone → cursor parallax
   → pinned story: camera orbits to top-down, parts are named, the screen's read becomes a case,
   the case becomes one tile in a dataset → bench case study → paths.
   The object is EDIO's own SmartClone model rendered by <model-viewer>; without WebGL or JS the
   transparent poster render stands in, so the hero still reads. */
(() => {
  'use strict';

  const html = document.documentElement;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  const { $, $$, split, lineDelays, revealHeadings, header } = window.EDIO;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  const hero = $('[data-hero]');
  const device = $('[data-device]');   // positioned box (CSS centres it)
  const rig = $('[data-rig]');         // what motion moves, so GSAP never fights the centring
  const model = $('[data-model]');
  const title = $('[data-hero-title]');
  const lines = $$('[data-split-line]', title);
  const light = $('[data-light]');
  const floor = $('[data-floor]');
  const boot = $('[data-boot]');
  const bootStatus = $('[data-boot-status]');
  const hotspots = $$('[data-hs]', hero);
  const hsDisplay = $('[data-hs-display]', hero);
  const caps = $$('[data-cap]', hero);
  const steps = $$('[data-steps] li', hero);
  const stepsBox = $('[data-steps]', hero);
  const caseEl = $('[data-case]', hero);
  const caseRows = $$('.case-head, .case-row', caseEl);
  const dataset = $('[data-dataset]', hero);
  const leader = $('[data-leader] path', hero);

  /* ---------- Camera: one place that turns numbers into the model's orbit ---------- */
  const BASE = { theta: 0, phi: 62, r: 96 };
  const cam = { ...BASE };
  const applyCam = () => {
    // attribute, not property: safe before <model-viewer> upgrades; interpolation-decay=1 keeps it immediate
    model.setAttribute('camera-orbit', `${cam.theta.toFixed(2)}deg ${cam.phi.toFixed(2)}deg ${cam.r.toFixed(2)}%`);
  };

  /* ---------- Layout: one composition at every size. The device's top face overlaps the headline's
     second line; in this camera view the faceplate top sits ~34% down the 16:9 model box, the base ~72%. ---------- */
  function placeDevice() {
    const hr = hero.getBoundingClientRect();
    // the last line the headline actually renders (phones wrap it to four), so the device overlaps "layer."
    const last = lines[lines.length - 1];
    const rg = document.createRange(); rg.selectNodeContents(last);
    const rs = rg.getClientRects(), l2 = rs.length ? rs[rs.length - 1] : last.getBoundingClientRect();
    const top = (l2.top - hr.top) + l2.height * (hero.clientWidth < 768 ? 1.02 : .8) - .34 * device.offsetHeight;
    hero.style.setProperty('--dev-top', Math.round(top) + 'px');
    return top;
  }
  function fitHeadline() {
    // phones: one size for every word, set so the longest word ("intelligence") fills the column;
    // the rest wraps naturally at that size, giving even lines instead of mixed sizes
    title.style.fontSize = '';
    if (hero.clientWidth >= 768) return;
    const la = lines[1];
    const avail = title.clientWidth;
    title.style.fontSize = '100px';
    const r = document.createRange(); r.selectNodeContents(la);
    const s = Math.min(84, Math.floor(100 * avail / r.getBoundingClientRect().width * 10) / 10);
    title.style.fontSize = s + 'px';
  }
  // phones, steps 2–3: where the small device sits, and the band below it for the case card / dataset
  const PHONE_SMALL = window.innerHeight < 780 ? .58 : .66;                            // device scale on phones during steps 2–3
  const phoneBand = () => {
    const H = hero.clientHeight, headerH = header.offsetHeight;
    const capH = Math.max(...caps.map(el => el.offsetHeight));
    const capTop = H - 64 - capH;
    const devC = headerH + H * .145;                   // centre of the small device
    const top = Math.round(devC + .3 * device.offsetHeight * PHONE_SMALL + 40);
    return { devC, top, room: capTop - 16 - top };
  };
  function placePhoneBand() {
    const b = phoneBand();
    caseEl.style.top = dataset.style.top = b.top + 'px';
  }
  function layoutPhone() {
    // headline split around the device: line 1 above, device, line 2 below; the group is centred on screen
    const second = lines[1].parentElement;                 // .ht-line holding "intelligence layer."
    const boxH = device.offsetHeight;
    const gap = 34;
    second.style.marginTop = Math.round(.40 * boxH + gap * 2) + 'px';   // room for the visible device
    const hr = hero.getBoundingClientRect();
    const headerH = header.offsetHeight;
    const pad0 = parseFloat(getComputedStyle(title).paddingTop);
    const top0 = title.getBoundingClientRect().top - hr.top + pad0;
    const h = second.getBoundingClientRect().bottom - (title.getBoundingClientRect().top + pad0);
    const want = headerH + (hero.clientHeight - headerH - h) * .48;
    hero.style.setProperty('--title-pad', Math.max(headerH + 16, Math.round(pad0 + want - top0)) + 'px');
    const r = document.createRange(); r.selectNodeContents(lines[0]);
    const rs = r.getClientRects(), last = rs[rs.length - 1];
    const l1Bottom = last.bottom - hero.getBoundingClientRect().top;
    // faceplate top sits ~33% down the model box
    hero.style.setProperty('--dev-top', Math.round(l1Bottom + gap - .33 * boxH) + 'px');
  }
  function layoutHero() {
    fitHeadline();
    hero.style.removeProperty('--title-pad');
    hero.style.removeProperty('--dev-w');
    lines[1].parentElement.style.marginTop = '';
    caseEl.style.top = dataset.style.top = '';
    if (hero.clientWidth < 768) { layoutPhone(); placePhoneBand(); return; }
    const hr = hero.getBoundingClientRect();
    const headerH = header.offsetHeight;
    const room = hero.clientHeight - headerH;
    const measure = () => {
      const top = placeDevice();
      const titleTop = lines[0].getBoundingClientRect().top - hr.top;
      return { top, titleTop, h: top + .74 * device.offsetHeight - titleTop };  // headline top → device base
    };
    let m = measure();
    // if headline + device are taller than ~86% of the screen, shrink the device until they fit
    if (m.h > room * .86) {
      const boxH = device.offsetHeight;
      const k = Math.max(.6, 1 - (m.h - room * .86) / (.74 * boxH));
      hero.style.setProperty('--dev-w', Math.round(device.offsetWidth * k) + 'px');
      m = measure();
    }
    // centre the pair: shift the headline down by half the leftover space (a touch above true centre reads better)
    const shift = (room - m.h) * .46 - (m.titleTop - headerH);
    hero.style.setProperty('--title-pad', Math.max(headerH + 12, Math.round(parseFloat(getComputedStyle(title).paddingTop) + shift)) + 'px');
    placeDevice();
  }

  /* ---------- Dataset tiles ---------- */
  const TILE_COUNT = 35, TARGET = 17, HOT = [3, 9, 12, 23, 30, 33];
  for (let i = 0; i < TILE_COUNT; i++) {
    const t = document.createElement('i');
    t.className = 'tile' + (HOT.includes(i) || i === TARGET ? ' is-hot' : '');
    dataset.appendChild(t);
  }
  const tiles = $$('.tile', dataset);
  const targetTile = tiles[TARGET];
  const hotTiles = HOT.map(i => tiles[i]);
  const tcol = TARGET % 7, trow = Math.floor(TARGET / 7);
  const coldTiles = tiles.filter((t, i) => i !== TARGET && !HOT.includes(i))
    .sort((a, b) => {
      const d = el => { const i = tiles.indexOf(el); return Math.hypot(i % 7 - tcol, Math.floor(i / 7) - trow); };
      return d(a) - d(b);
    });

  /* ---------- Leader: from the device's display to the case card ---------- */
  function drawLeader() {
    const hr = hero.getBoundingClientRect();
    const a = hsDisplay.getBoundingClientRect();
    const c = caseEl.getBoundingClientRect();
    const ax = a.left - hr.left, ay = a.top - hr.top;
    const cx = c.left - hr.left, cy = c.top - hr.top + 44;
    const mx = ax + (cx - ax) * .55;
    leader.setAttribute('d', cx > ax ? `M${ax} ${ay} H${mx} V${cy} H${cx}` : `M${ax} ${ay} V${c.bottom - hr.top}`);
  }

  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('is-intro'); hero.classList.add('is-placed'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // touch devices: ScrollTrigger handles the scroll so pinned scenes never jump when the address bar moves
  if (window.matchMedia('(pointer: coarse)').matches) ScrollTrigger.normalizeScroll(true);

  /* ---------- Bench section (collage panels) ---------- */
  const BENCH_IMG = { w: 1254, h: 1254 };
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
  const applyPlate = (el, g) => { el.style.cssText = `left:${g.l}px;top:${g.t}px;width:${g.w}px;height:${g.h}px`; };
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
      gsap.set(p.plate, { transformOrigin: `${p.ax * size}px ${p.ay * size}px` });
    });
  }

  // floor line sits exactly at the device base (~74% down the model box)
  const horizon = $('[data-horizon]');
  const placeHorizon = () => { if (horizon) horizon.style.top = Math.round(device.offsetTop + .745 * device.offsetHeight) + 'px'; };
  function layout() { layoutHero(); placeHorizon(); layoutBench(); }
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);
  let placed = false;
  if (document.fonts) document.fonts.ready.then(() => {
    if (!placed) return;                                // on time: the intro handles placement
    gsap.to([rig, title], { opacity: 0, duration: .2, onComplete() { ScrollTrigger.refresh(); gsap.to([rig, title], { opacity: 1, duration: .5 }); } });
  });

  /* ==========================================================================
     INTRO — the stage lights, the headline sets, the device rises (~2.6s)
     ========================================================================== */
  const titleWords = lines.flatMap(l => split(l));
  // one span per letter inside each word, for the typewriter intro
  const titleChars = titleWords.flatMap(w => {
    const t = w.textContent; w.textContent = '';
    return [...t].map(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.appendChild(s); return s; });
  });
  let scanTl = null;

  function typeHeadline() {
    const per = .026;                                   // seconds per letter
    const tl = gsap.timeline();
    titleChars.forEach((ch, i) => {
      tl.call(() => {
        ch.style.opacity = 1;
        titleChars.forEach(o => o.classList.remove('is-caret'));
        ch.classList.add('is-caret');
      }, null, i * per);
    });
    // cursor blinks at the end, then leaves
    tl.call(() => title.classList.add('is-typed'), null, titleChars.length * per)
      .call(() => titleChars.forEach(o => o.classList.remove('is-caret')), null, titleChars.length * per + 1.6);
    return tl;
  }

  function runIntro(onDone) {
    // skip if motion is reduced, the page is scrolled, or the slow-load failsafe already showed the text
    const skip = reduceMQ.matches || window.scrollY > window.innerHeight * .4 || window.__introShown;
    html.classList.remove('is-intro');
    if (skip) { onDone(); return; }

    gsap.set([header, light, floor], { opacity: 0 });
    gsap.set(titleChars, { opacity: 0 });
    gsap.set(rig, { opacity: 0 });
    Object.assign(cam, BASE); applyCam();

    gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: onDone })
      .to(boot, { opacity: 1, duration: .3 }, .05)
      .fromTo(bootStatus, { opacity: .25 }, { opacity: 1, duration: .14, repeat: 4, yoyo: true, ease: 'steps(1)' }, .15)
      .call(() => { bootStatus.textContent = 'Online'; }, null, .85)
      .to(boot, { opacity: 0, duration: .35 }, 1.0)
      .to(light, { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, .55)
      .to(floor, { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, .7)
      // typewriter: one letter at a time with a cursor riding the last typed letter; the device fades up alongside
      .to(rig, { opacity: 1, duration: 1.2, ease: 'sine.inOut' }, .5)      // the device arrives first
      .add(typeHeadline(), 1.5)                                              // then the headline types in
      .to(header, { opacity: 1, duration: .8 }, 1.5);
  }

  /* ==========================================================================
     REPAIR SCAN — a thin cyan pass over the device; each part it crosses is named for a moment
     ========================================================================== */
  const scan = document.createElement('i');
  scan.className = 'scan';
  scan.setAttribute('aria-hidden', 'true');
  device.appendChild(scan);
  const scanState = { p: 0 };

  function buildScan(mobile) {
    const hit = new Set();
    const sweep = () => {
      const r = device.getBoundingClientRect();
      const x0 = r.left + r.width * .24, x1 = r.left + r.width * .76;
      const x = x0 + (x1 - x0) * scanState.p;
      gsap.set(scan, { x: x - r.left });
      hotspots.forEach(h => {
        if (hit.has(h)) return;
        if (h.getBoundingClientRect().left <= x) {
          hit.add(h); h.classList.add('is-hit');
          gsap.delayedCall(1.6, () => h.classList.remove('is-hit'));
        }
      });
    };
    return gsap.timeline({ repeat: -1, repeatDelay: mobile ? 12 : 7, paused: true, delay: 1.2 })
      .call(() => hit.clear())
      .to(scan, { opacity: .9, duration: .25 }, 0)
      .fromTo(scanState, { p: 0 }, { p: 1, duration: mobile ? 2.4 : 2, ease: 'sine.inOut', onUpdate: sweep }, 0)
      .to(scan, { opacity: 0, duration: .3 }, mobile ? 2.1 : 1.7);
  }

  /* ==========================================================================
     STORY — physical repair → captured information → structured data (scrubbed, pinned)
     ========================================================================== */
  function buildStory({ mobile, reduce }) {
    const lift = reduce ? 0 : -150;
    let phase = -1;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate() {
        const t = tl.time();
        const p = t < 3.1 ? 0 : t < 5.6 ? 1 : 2;
        if (p !== phase) { phase = p; steps.forEach((s, i) => s.classList.toggle('is-on', i === p)); }
        if (t > 3 && t < 6.2) drawLeader();
      },
      scrollTrigger: {
        trigger: hero, start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (mobile ? 2.6 : 3.2)),
        pin: true, scrub: mobile ? 1 : .7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate(self) {
          if (!scanTl) return;
          const active = self.progress < .03;
          if (active && scanTl.paused()) scanTl.play();
          if (!active && !scanTl.paused()) { scanTl.pause(0); gsap.set(scan, { opacity: 0 }); hotspots.forEach(h => h.classList.remove('is-hit')); }
        }
      }
    });

    // centre of the stage, measured when the trigger refreshes
    const toCentre = () => (hero.clientHeight * (mobile ? .44 : .47)) - (device.offsetTop + device.offsetHeight / 2);
    const centreX = () => { const r = device.getBoundingClientRect(), h = hero.getBoundingClientRect(); return h.width / 2 - (r.left - h.left + r.width / 2); };
    const shiftLeft = () => centreX() - (mobile ? 0 : hero.clientWidth * .2);
    if (horizon) tl.to(horizon, { opacity: 0, duration: 1.2 }, 0);   // floor line belongs to the first screen only

    if (mobile) {
      // phones: the device steps up out of the way; the case card and dataset form in the band beneath it
      const upSmall = () => phoneBand().devC - (device.offsetTop + device.offsetHeight / 2);
      tl.to(title, { y: lift, opacity: 0, duration: 1.8, ease: 'power1.in' }, 0)
        .to(rig, { y: toCentre, scale: .92, duration: 2.2, ease: 'power1.inOut' }, 0)
        .to(cam, { theta: 0, phi: 22, r: 94, duration: 2.2, ease: 'power1.inOut', onUpdate: applyCam }, 0)
        .fromTo(caps[0], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 1.5)
        .fromTo(stepsBox, { opacity: 0 }, { opacity: 1, duration: .6 }, 1.5)
      // the device never stops: every bit of scroll turns it a little further, with a slow lift and tilt
        .to(cam, { theta: 22, phi: 30, duration: 0.8, ease: 'sine.inOut', onUpdate: applyCam }, 2.2)
        .to(cam, { theta: -24, phi: 42, r: 96, duration: 2.6, ease: 'sine.inOut', onUpdate: applyCam }, 3.0)
        .to(cam, { theta: 28, phi: 34, r: 94, duration: 3.4, ease: 'sine.inOut', onUpdate: applyCam }, 5.6)
        .to(rig, { rotation: 2.5, duration: 2.6, ease: 'sine.inOut' }, 3.0)
        .to(rig, { rotation: -2.5, duration: 3.4, ease: 'sine.inOut' }, 5.6)
      // 02
        .to(caps[0], { opacity: 0, y: -16, duration: .5 }, 3.0)
        .to(rig, { y: upSmall, scale: PHONE_SMALL, duration: 1.1, ease: 'power2.inOut' }, 3.0)
        .fromTo(caseEl, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, 3.8)
        .fromTo(caseRows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .35, stagger: .16, ease: 'power2.out' }, 3.95)
        .fromTo(caps[1], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 3.7)
      // 03
        .to(caps[1], { opacity: 0, y: -16, duration: .5 }, 5.6)
        .to(caseRows, { opacity: 0, duration: .35, stagger: .04 }, 5.6)
        .to(caseEl, {
          x: () => dataset.offsetLeft + targetTile.offsetLeft - caseEl.offsetLeft,
          y: () => dataset.offsetTop + targetTile.offsetTop - caseEl.offsetTop,
          scaleX: () => targetTile.offsetWidth / caseEl.offsetWidth,
          scaleY: () => targetTile.offsetHeight / caseEl.offsetHeight,
          duration: 1.1, ease: 'power3.inOut'
        }, 6.0)
        .fromTo(coldTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .03 }, 6.5)
        .fromTo(targetTile, { opacity: 0 }, { opacity: 1, duration: .2 }, 7.05)
        .to(caseEl, { opacity: 0, duration: .2 }, 7.1)
        .fromTo(hotTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, 7.3)
        .fromTo(caps[2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 6.3)
        .to({}, { duration: .8 }, 8.2);
      return tl;
    }

    // --- 01 Physical repair: the headline lifts away; the camera looks down at the faceplate ---
    tl.to(title, { y: lift, opacity: 0, duration: 1.8, ease: 'power1.in' }, 0)
      .to(rig, { y: toCentre, scale: mobile ? 1.05 : 1.12, duration: 2.2, ease: 'power1.inOut' }, 0)
      .to(cam, { theta: 0, phi: 16, r: 92, duration: 2.2, ease: 'power1.inOut', onUpdate: applyCam }, 0)
      .to(light, { opacity: .7, duration: 2 }, 0)
      .to(hero, { '--hs': 1, duration: .8 }, 1.3)
      .fromTo(caps[0], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 1.5)
      .fromTo(stepsBox, { opacity: 0 }, { opacity: 1, duration: .6 }, 1.5)

    // --- 02 Captured information: what the display read becomes a case ---
      .to(caps[0], { opacity: 0, y: -16, duration: .5 }, 3.0)
      .to(rig, { x: shiftLeft, y: () => toCentre() - hero.clientHeight * (mobile ? .02 : .07), scale: mobile ? 1 : 1.02, duration: 1.1, ease: 'power2.inOut' }, 3.0)
      .to(cam, { theta: mobile ? 0 : 10, duration: 1.1, ease: 'power2.inOut', onUpdate: applyCam }, 3.0)
      .to(hero, { '--hs': 0, '--hs-keep': mobile ? 0 : 1, duration: .6 }, 3.1)
      .fromTo(leader, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' }, 3.5)
      .fromTo(caseEl, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, 3.8)
      .fromTo(caseRows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .35, stagger: .16, ease: 'power2.out' }, 3.95)
      .fromTo(caps[1], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 3.7)

    // --- 03 Structured data: one case, one tile, a growing dataset ---
      .to(caps[1], { opacity: 0, y: -16, duration: .5 }, 5.6)
      .to(caseRows, { opacity: 0, duration: .35, stagger: .04 }, 5.6)
      .to(leader, { strokeDashoffset: 1, duration: .5 }, 5.6)
      .to(hero, { '--hs-keep': 0, duration: .5 }, 5.6)
      .to(caseEl, {
        x: () => dataset.offsetLeft + targetTile.offsetLeft - caseEl.offsetLeft,
        y: () => dataset.offsetTop + targetTile.offsetTop - caseEl.offsetTop,
        scaleX: () => targetTile.offsetWidth / caseEl.offsetWidth,
        scaleY: () => targetTile.offsetHeight / caseEl.offsetHeight,
        duration: 1.1, ease: 'power3.inOut'
      }, 6.0)
      .fromTo(coldTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .03 }, 6.5)
      .fromTo(targetTile, { opacity: 0 }, { opacity: 1, duration: .2 }, 7.05)
      .to(caseEl, { opacity: 0, duration: .2 }, 7.1)
      .fromTo(hotTiles, { opacity: 0 }, { opacity: 1, duration: .3, stagger: .1 }, 7.3)
      .fromTo(caps[2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 6.3)
      .to({}, { duration: .8 }, 8.2);


    return tl;
  }

  function buildBench({ mobile, reduce }) {
    const annos = $$('[data-anno]', bench);
    const annoLines = $$('[data-anno-line]', bench);
    const labels = $$('[data-anno-label]', bench);
    const index = $$('[data-index] li', bench);
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
        .fromTo(annoLines[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, at + .15)
        .fromTo(labels[i], { opacity: 0 }, { opacity: 1, duration: .25 }, at + .45)
        .fromTo(index[i], { opacity: .3, '--fill': 0 }, { opacity: 1, '--fill': 1, duration: .4 }, at + .3);
    });
    tl.to({}, { duration: .4 });
  }

  /* ---------- Cursor parallax: light 8px, device 14px, headline 3px ---------- */
  function buildParallax() {
    const q = (el, amt, dur) => ({ amt, x: gsap.quickTo(el, 'x', { duration: dur, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: dur, ease: 'power3' }) });
    const layers = [q(light, 8, 1.2), q($('.device-model', device), 14, 1.2), q(title, 3, 1.4)];
    const turn = gsap.quickTo(cam, 'theta', { duration: 1.4, ease: 'power3', onUpdate: applyCam });
    const onMove = e => {
      if (window.scrollY > 40) return;
      const nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
      layers.forEach(l => { l.x(-nx * 2 * l.amt); l.y(-ny * 2 * l.amt); });
      turn(BASE.theta + nx * 6);   // the object turns a few degrees toward the cursor
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set([light, $('.device-model', device), title], { x: 0, y: 0 });
    };
  }

  // wait for the headline font (max 1.5s) so the device is placed once, against final text metrics
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(() => {
  layout();
  placed = true;
  hero.classList.add('is-placed');
  runIntro(() => {
    revealHeadings(null, reduceMQ.matches);
    const mm = gsap.matchMedia();
    mm.add({
      mobile: '(max-width: 767px)',
      reduce: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)'
    }, ctx => {
      const { mobile, reduce, fine } = ctx.conditions;
      layout();
      Object.assign(cam, BASE); applyCam();
      buildStory({ mobile, reduce });
      buildBench({ mobile, reduce });
      if (!reduce && !mobile) { scanTl = buildScan(mobile); if (window.scrollY < 40) scanTl.play(); }
      const killParallax = (!reduce && fine && !mobile) ? buildParallax() : null;
      return () => {
        if (scanTl) { scanTl.kill(); scanTl = null; }
        if (killParallax) killParallax();
      };
    });
  });
  });
})();
