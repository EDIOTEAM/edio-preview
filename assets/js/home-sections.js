/* EDIO — Homepage sections 04–09 (after the hero story).
   Kept separate from home.js so the approved hero is never affected.
   Motion is light: problem fragments drift apart slightly; the flow draws itself as you scroll. */
(() => {
  'use strict';
  const { $, $$ } = window.EDIO;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const flow = $('[data-flow]');
  const ins = $$('[data-flow-in]', flow);
  const wires = $$('[data-flow-wire]', flow);
  const core = $('[data-flow-core]', flow);
  const steps = $$('[data-flow-step]', flow);

  // resting state without GSAP or with reduced motion: everything visible
  const showAll = () => {
    ins.forEach(el => el.classList.add('is-on'));
    steps.forEach(el => el.classList.add('is-on'));
    wires.forEach(w => w.style.setProperty('--draw', 0));
    core.style.setProperty('--glow', 1);
    core.style.setProperty('--out-w', '90px');
  };
  if (reduce || !window.gsap || !window.ScrollTrigger) { showAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // the hero pins its story only after the 3D model loads; set up after that so positions include the pin
  const whenHeroPinned = cb => {
    const t0 = performance.now();
    (function wait() {
      if (document.querySelector('.pin-spacer') || performance.now() - t0 > 8000) { cb(); ScrollTrigger.refresh(); }
      else setTimeout(wait, 150);
    })();
  };
  whenHeroPinned(() => {

  /* 05 flow: sources light → wires draw into EDIO → EDIO glows → steps light in order */
  const state = { p: 0 };
  const paint = () => {
    const p = state.p;
    ins.forEach((el, i) => el.classList.toggle('is-on', p > .05 + i * .06));
    wires.forEach((w, i) => w.style.setProperty('--draw', Math.max(0, 1 - (p - .1 - i * .04) / .25).toFixed(3)));
    const g = Math.min(1, Math.max(0, (p - .42) / .12));
    core.style.setProperty('--glow', g.toFixed(3));
    core.style.setProperty('--out-w', Math.round(Math.min(1, Math.max(0, (p - .5) / .15)) * 90) + 'px');
    steps.forEach((el, i) => el.classList.toggle('is-on', p > .58 + i * .09));
  };
  ScrollTrigger.create({
    trigger: flow, start: 'top 70%', end: 'bottom 75%', scrub: .6,
    onUpdate: self => { state.p = self.progress; paint(); }
  });
  paint();

  /* 04 problem: fragments drift a little apart as the section passes — scattered, not connected */
  $$('[data-frag]').forEach(f => {
    const d = +getComputedStyle(f).getPropertyValue('--d') || 0;
    const dx = [-14, 16, -12, 14][d] || 0, dy = [-10, -14, 12, 10][d] || 0;
    gsap.fromTo(f, { x: -dx * .4, y: -dy * .4 }, {
      x: dx, y: dy, ease: 'none',
      scrollTrigger: { trigger: '[data-scatter]', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  });
})();
