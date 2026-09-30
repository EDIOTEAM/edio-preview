/* EDIO — Homepage vision section: a slowly turning globe behind "To make every repair smarter."
   The globe is a latitude/longitude grid; every box of it, the pole caps included, carries a photo
   of EDIO's repair work, mapped onto the curved box so its edges follow the grid lines. Photos sit
   translucent; now and then a random one fades up to full strength and back. A soft white glow
   sits behind the words, like frosted glass, so the text always reads over the photos.
   It turns on its own; scrolling the page spins it, and it can be dragged (sideways swipe on touch).
   Photos load only as the section comes near. Pauses off screen; one still frame with reduced motion. */
(() => {
  'use strict';
  const section = document.querySelector('[data-vision]');
  const canvas = section && section.querySelector('[data-vision-fx]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TEAL = '11, 127, 145';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- the photos: repair work first; [src, crop x, y, w, h] in source pixels (optional) ---------- */
  const COLLAGE = 'assets/img/repair-people.jpg';   // four bench portraits in one 1254² image
  const PHOTOS = [
    ['assets/img/intelligence/bench-probe.webp'],
    [COLLAGE, 16, 12, 588, 590],
    ['assets/img/hardware/mode-eeprom-clip.webp'],
    ['assets/img/impact/tech-multimeter.webp'],
    [COLLAGE, 650, 12, 590, 590],
    ['assets/img/hardware/smartclone-bench.webp'],
    ['assets/img/intel-bench.webp'],
    ['assets/img/hardware/mode-uart.webp'],
    [COLLAGE, 16, 642, 588, 590],
    ['assets/img/about/founder-bench.webp'],
    ['assets/img/hardware/mode-soic8.webp'],
    ['assets/img/hardware/smartclone-board.webp'],
    [COLLAGE, 650, 642, 590, 590],
    ['assets/img/hardware/mode-ir.webp'],
    ['assets/img/training-day.jpg'],
    ['assets/img/hardware/mode-macro.webp'],
    ['assets/img/hardware/smartclone-top.webp'],
    ['assets/img/edio-team.jpg'],
    ['assets/img/about/karur-conclave.webp'],
    ['assets/img/about/cedi-funding.webp'],
  ];
  const THUMB = 256;
  const thumbs = new Array(PHOTOS.length).fill(null);
  let photosAsked = false;
  function loadPhotos() {
    if (photosAsked) return;
    photosAsked = true;
    const cache = {};
    PHOTOS.forEach(([src, cx, cy, cw, ch], i) => {
      const img = cache[src] || (cache[src] = new Image());
      const cut = () => {
        // centre-crop to a square (or the given crop), once, into a small canvas
        let sx = cx || 0, sy = cy || 0, sw = cw || img.naturalWidth, sh = ch || img.naturalHeight;
        const side = Math.min(sw, sh);
        sx += (sw - side) / 2; sy += (sh - side) / 2;
        const c = document.createElement('canvas'); c.width = c.height = THUMB;
        const g = c.getContext('2d');
        g.filter = 'saturate(.85) contrast(1.03)';
        g.drawImage(img, sx, sy, side, side, 0, 0, THUMB, THUMB);
        thumbs[i] = c;
        start();
      };
      if (img.complete && img.naturalWidth) cut();
      else img.addEventListener('load', cut, { once: true });
      if (!img.src) { img.decoding = 'async'; img.src = src; }
    });
  }

  /* ---------- sizes, and the text box the glow sits behind ---------- */
  let W = 0, H = 0, dpr = 1, textBox = null;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = section.clientWidth; H = section.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const sr = section.getBoundingClientRect();
    // everything that has to read: the label, the headline's lines, the paragraph and the buttons
    const q = sel => section.querySelector(sel).getBoundingClientRect();
    const rg = document.createRange(); rg.selectNodeContents(section.querySelector('.hs-vision-title'));
    const rects = [q('.kicker'), ...rg.getClientRects(), q('.hs-vision-sub'), q('.hs-vision-cta')];
    textBox = {
      l: Math.min(...rects.map(r => r.left)) - sr.left, r: Math.max(...rects.map(r => r.right)) - sr.left,
      t: Math.min(...rects.map(r => r.top)) - sr.top, b: Math.max(...rects.map(r => r.bottom)) - sr.top,
    };
  }

  /* ---------- turning: on its own, from page scroll, and by dragging ---------- */
  const spin = { y: 0, x: 0, vy: 0 };      // offsets added to the slow automatic turn
  let lastScroll = window.scrollY, onScreen = false;
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScroll; lastScroll = window.scrollY;
    if (!onScreen || reduce) return;
    spin.vy = clamp(spin.vy + dy * .00055, -.09, .09);   // scrolling gives it a turn that eases out
    start();
  }, { passive: true });
  let drag = null;
  section.addEventListener('pointerdown', e => {
    if (reduce || e.button > 0 || e.target.closest('a, button')) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, v: 0, t: performance.now() };
  });
  section.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      // vertical on touch stays a page scroll; sideways (or any mouse drag) turns the globe
      if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      drag.moved = true; section.classList.add('is-turning');
      try { section.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const now = performance.now(), dt = Math.max(8, now - drag.t);
    spin.y += dx * .006;
    spin.x = clamp(spin.x + dy * .004, -.5, .5);
    drag.v = dx * .006 / dt * 16;                          // per frame, for the throw
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
    spin.vy = 0;
    start();
  });
  const endDrag = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) spin.vy = clamp(drag.v, -.12, .12);
    drag = null; section.classList.remove('is-turning');
  };
  section.addEventListener('pointerup', endDrag);
  section.addEventListener('pointercancel', endDrag);

  /* ---------- the globe: a latitude/longitude grid ---------- */
  const LAT = 8, LON = 14, SUB = 3;                       // bands, meridians, subdivisions per box edge
  const GI = LAT * SUB, GJ = LON * SUB;                    // fine grid for curved lines and boxes
  const FINE = [];                                         // unit-sphere points, [i][j]
  for (let i = 0; i <= GI; i++) {
    const th = i / GI * Math.PI, row = [];
    for (let j = 0; j < GJ; j++) {
      const ph = j / GJ * Math.PI * 2;
      row.push([Math.sin(th) * Math.sin(ph), -Math.cos(th), -Math.sin(th) * Math.cos(ph)]);
    }
    FINE.push(row);
  }
  // photo boxes: every box, the pole caps included (their boxes taper to the pole); photos spread so
  // neighbours differ. Each box has a "lit" level: all photos sit translucent, and now and then a random
  // one fades up to full strength, holds, and fades back.
  const BOXES = [];
  for (let bi = 0; bi < LAT; bi++) for (let bj = 0; bj < LON; bj++) BOXES.push({ bi, bj, photo: (bi * 7 + bj * 3) % PHOTOS.length, lit: 0, until: 0 });
  const DIM = .3, FULL = .95;
  let nextLight = 0, glowOval = null;   // { x, y, rx, ry }, set each frame where the glow is drawn
  const underGlow = (x, y) => !!glowOval && ((x - glowOval.x) / glowOval.rx) ** 2 + ((y - glowOval.y) / glowOval.ry) ** 2 < .75;
  function lightRandom(t, facingBoxes) {
    if (t < nextLight || !facingBoxes.length) return;
    nextLight = t + .7 + Math.random() * 1.1;
    // prefer boxes turned well toward the viewer, not already lit, and not hidden under the words' glow
    const pool = facingBoxes.filter(o => o.facing > .35 && o.bx.until < t && !underGlow(o.mid[0], o.mid[1]));
    const pick = (pool.length ? pool : facingBoxes)[Math.floor(Math.random() * (pool.length || facingBoxes.length))];
    pick.bx.until = t + 2.2 + Math.random() * 1.6;
  }

  // one textured triangle: image points (u,v) → screen points (x,y), clipped, grown a hair to hide seams
  function tri(img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    const mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3, g = .6;
    const grow = (x, y) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + (x - mx) / d * g, y + (y - my) / d * g]; };
    const [a0, b0] = grow(x0, y0), [a1, b1] = grow(x1, y1), [a2, b2] = grow(x2, y2);
    const den = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
    if (Math.abs(den) < 1e-6) return;
    const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / den;
    const b = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / den;
    const c = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / den;
    const d = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / den;
    const e = (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / den;
    const f = (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / den;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); ctx.lineTo(a2, b2); ctx.closePath(); ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  let auto = 0, lastT = 0;
  function draw(t) {
    const dt = lastT ? Math.min(.05, t - lastT) : 0; lastT = t;
    if (!reduce) {
      auto += dt * .09;
      spin.y += spin.vy * dt * 60;
      spin.vy *= Math.pow(.94, dt * 60);
    }
    // wide screens: behind the words. Phones: the words fill the width, so it sits under the buttons
    // (the section leaves room for it), where its photos can be seen
    const narrow = W < 768 && textBox;
    const R = narrow ? W * .42 : Math.min(W * .34, H * .44), cx = W / 2;
    const cy = narrow ? textBox.b + 56 + R : H * .5;
    const ay = auto + spin.y, ax = -.32 + spin.x;
    const cA = Math.cos(ay), sA = Math.sin(ay), cB = Math.cos(ax), sB = Math.sin(ax);
    // rotate and project the fine grid once per frame: [x, y, z]
    const P = FINE.map(row => row.map(([x, y, z]) => {
      const x1 = x * cA + z * sA, z1 = -x * sA + z * cA;
      const y2 = y * cB - z1 * sB, z2 = y * sB + z1 * cB;
      const k = 3 / (3 + z2);
      return [cx + x1 * R * k, cy + y2 * R * k, z2];
    }));
    const at = (i, j) => P[i][((j % GJ) + GJ) % GJ];

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // grid lines: meridians and parallels, brighter on the near side (photos cover the near boxes)
    ctx.lineWidth = 1;
    const seg = (p, q, base, span) => {
      const front = (2 - (p[2] + q[2])) / 4;
      ctx.strokeStyle = `rgba(${TEAL}, ${(base + span * front).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    };
    for (let j = 0; j < GJ; j += SUB) for (let i = 0; i < GI; i++) seg(at(i, j), at(i + 1, j), .04, .18);
    for (let i = SUB; i < GI; i += SUB) for (let j = 0; j < GJ; j++) seg(at(i, j), at(i, j + 1), .04, .18);

    // photo boxes on the facing half, far ones first
    const boxes = [];
    BOXES.forEach(bx => {
      const img = thumbs[bx.photo]; if (!img) return;
      const mid = at(bx.bi * SUB + (SUB >> 1), bx.bj * SUB + (SUB >> 1));
      const facing = -mid[2];
      if (facing > .08) boxes.push({ bx, img, facing, mid });
    });
    boxes.sort((a, b) => a.facing - b.facing);
    if (!reduce) lightRandom(t, boxes);
    // ease each box's lit level toward on (while its time lasts) or off
    BOXES.forEach(bx => {
      const on = bx.until > t ? 1 : 0;
      bx.lit += (on - bx.lit) * Math.min(1, dt * (on ? 3.2 : 1.6));
    });
    const step = THUMB / SUB;
    boxes.forEach(({ bx, img, facing, mid }) => {
      const i0 = bx.bi * SUB, j0 = bx.bj * SUB;
      const alpha = clamp((facing - .08) / .3) * (DIM + (FULL - DIM) * bx.lit);
      if (alpha < .02) return;
      ctx.globalAlpha = alpha;
      for (let a = 0; a < SUB; a++) for (let b = 0; b < SUB; b++) {
        const p00 = at(i0 + a, j0 + b), p01 = at(i0 + a, j0 + b + 1), p10 = at(i0 + a + 1, j0 + b), p11 = at(i0 + a + 1, j0 + b + 1);
        const u0 = b * step, u1 = (b + 1) * step, v0 = a * step, v1 = (a + 1) * step;
        tri(img, p00[0], p00[1], p01[0], p01[1], p11[0], p11[1], u0, v0, u1, v0, u1, v1);
        tri(img, p00[0], p00[1], p11[0], p11[1], p10[0], p10[1], u0, v0, u1, v1, u0, v1);
      }
    });
    ctx.globalAlpha = 1;

    // the near box edges again on top, as fine teal seams between the photos
    for (let j = 0; j < GJ; j += SUB) for (let i = 0; i < GI; i++) {
      const p = at(i, j), q = at(i + 1, j); if (p[2] + q[2] < 0) seg(p, q, .1, .25);
    }
    for (let i = SUB; i < GI; i += SUB) for (let j = 0; j < GJ; j++) {
      const p = at(i, j), q = at(i, j + 1); if (p[2] + q[2] < 0) seg(p, q, .1, .25);
    }

    // a soft white glow behind the words, like frosted glass, so they read over the photos
    if (textBox) {
      // an oval that is solid over the text and fades out softly past its edges
      const gx = (textBox.l + textBox.r) / 2, gy = (textBox.t + textBox.b) / 2;
      const rx = (textBox.r - textBox.l) / 2 * 1.3 + 30, ry = (textBox.b - textBox.t) / 2 * 1.3 + 30;
      glowOval = { x: gx, y: gy, rx, ry };
      ctx.save();
      ctx.translate(gx, gy); ctx.scale(1, ry / rx);          // real pixel radius, squashed into an oval
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      glow.addColorStop(0, 'rgba(255, 255, 255, .9)'); glow.addColorStop(.72, 'rgba(255, 255, 255, .84)');
      glow.addColorStop(.9, 'rgba(255, 255, 255, .4)'); glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // the grid's crossings, a few glowing softly in turn
    for (let i = SUB; i < GI; i += SUB) for (let j = 0; j < GJ; j += SUB) {
      const [x, y, z] = at(i, j), front = (1 - z) / 2;
      if (front < .3) continue;
      const pulse = Math.max(0, Math.sin(t * .8 + (i * 31 + j * 17) * .37)) ** 24;
      ctx.fillStyle = `rgba(${TEAL}, ${(.25 + .4 * front * (.5 + pulse)).toFixed(3)})`;
      const s = 1.6 + 1.2 * front + 1.6 * pulse;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }

  let raf = 0, visible = false;
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    draw(reduce ? 8 : (now - t0) / 1000);
    if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else lastT = 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  size();
  if ('IntersectionObserver' in window) {
    // photos start loading a screen ahead; drawing runs only while the section is on screen
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) loadPhotos(); }), { rootMargin: '900px 0px' }).observe(section);
    new IntersectionObserver(es => es.forEach(e => { visible = onScreen = e.isIntersecting; if (visible) start(); }), { rootMargin: '100px 0px' }).observe(section);
  } else { loadPhotos(); visible = onScreen = true; start(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { size(); start(); }); });
  if (document.fonts) document.fonts.ready.then(() => { size(); start(); });
})();
