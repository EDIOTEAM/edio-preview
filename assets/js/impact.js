/* EDIO — Impact page
   Calculator first (works without GSAP): kg = units × carbon × share, same model as the previous site.
   Then motion: lifecycle diagram draws the shared trunk, then both exits; the staircase rises. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays, revealHeadings } = window.EDIO;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Calculator ---------- */
  const DEFAULTS = { carbon: 350, units: 500, share: 70 };
  const KG_PER_KM = 0.19, KG_PER_TREE_YEAR = 25;
  const calc = $('[data-calc]');
  const f = calc.elements;
  const ranges = { carbon: $('[data-sync="carbon"]', calc), units: $('[data-sync="units"]', calc), share: f.share };
  const out = {
    co2: $('[data-co2]'), formula: $('[data-formula]'), devices: $('[data-devices]'),
    km: $('[data-km]'), trees: $('[data-trees]'), share: $('[data-share-out]')
  };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0; };

  function paintFill(r) {
    const p = (Math.min(+r.max, Math.max(+r.min, +r.value)) - +r.min) / (+r.max - +r.min) * 100;
    r.style.setProperty('--fill', p + '%');
  }
  function render() {
    const carbon = num(f.carbon.value), units = num(f.units.value), share = Math.min(100, num(f.share.value));
    const kg = units * carbon * share / 100;
    const t = kg / 1000;
    out.co2.textContent = t.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    out.formula.textContent = `${fmt(units)} units × ${fmt(carbon)} kg × ${share}% = ${fmt(kg)} kg CO₂e`;
    out.devices.textContent = fmt(units * share / 100);
    out.km.textContent = fmt(kg / KG_PER_KM);
    out.trees.textContent = fmt(kg / KG_PER_TREE_YEAR);
    out.share.textContent = share + '%';
    Object.values(ranges).forEach(paintFill);
  }

  // number box ⇄ slider (the box can go past the slider's range; the slider just pins at max)
  ['carbon', 'units'].forEach(k => {
    f[k].addEventListener('input', () => { ranges[k].value = num(f[k].value); render(); });
    ranges[k].addEventListener('input', () => { f[k].value = ranges[k].value; render(); });
    f[k].addEventListener('blur', () => { if (!num(f[k].value)) { f[k].value = 0; render(); } }); // empty or invalid → 0
  });
  f.share.addEventListener('input', render);
  $('[data-reset]', calc).addEventListener('click', () => {
    Object.entries(DEFAULTS).forEach(([k, v]) => { f[k].value = v; ranges[k].value = v; });
    render();
  });
  render();

  /* ---------- Motion ---------- */
  const title = $('.im-title');
  const titleWords = split(title);
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('is-intro'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  revealHeadings(title, reduce);

  if (reduce || window.scrollY > window.innerHeight * .4) {
    html.classList.remove('is-intro');
  } else {
    const fades = $$('[data-im-fade]');
    const paths = $('[data-paths]');
    const trunk = $('.p-trunk', paths), replace = $('.p-replace', paths), repair = $('.p-repair', paths);
    const nodes = $$('.p-node', paths);
    const texts = $$('text', paths);
    const d = lineDelays(titleWords);
    gsap.set(titleWords, { yPercent: 105 });
    gsap.set(fades, { opacity: 0, y: 12 });
    gsap.set('.ml-h', { scaleX: 0 });
    gsap.set('.ml-v', { scaleY: 0 });
    gsap.set([trunk, repair], { strokeDashoffset: 1 });
    gsap.set(replace, { opacity: 0 });
    gsap.set(nodes, { opacity: 0 });
    gsap.set(texts, { opacity: 0 });
    html.classList.remove('is-intro');

    // node i belongs to: 0 make, 1 use, 2 fault, then replace/repair pairs share --i 3 and 4
    const byStep = i => nodes.filter(n => n.style.getPropertyValue('--i') === String(i));
    const label = s => texts.filter(t => t.textContent === s);
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('.ml-h', { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0)
      .to('.ml-v', { scaleY: 1, duration: 1, stagger: .08, ease: 'expo.inOut' }, .05)
      .to(fades[0], { opacity: 1, y: 0, duration: .5 }, .1)
      .to(titleWords, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: i => d[i] }, .25)
      .to(fades.slice(1), { opacity: 1, y: 0, duration: .6, stagger: .08 }, .8)
      // shared trunk: make → use → fault
      .to(byStep(0), { opacity: 1, duration: .3 }, .6).to(label('Make'), { opacity: 1, duration: .3 }, .6)
      .to(trunk, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' }, .6)
      .to(byStep(1), { opacity: 1, duration: .3 }, .95).to(label('Use'), { opacity: 1, duration: .3 }, .95)
      .to(byStep(2), { opacity: 1, duration: .3 }, 1.35).to(label('Fault'), { opacity: 1, duration: .3 }, 1.35)
      // the old exit, faint; then the repair exit, drawn
      .to(replace, { opacity: 1, duration: .6 }, 1.55)
      .to([...byStep(3), ...byStep(4)].filter(n => n.classList.contains('p-node--r')), { opacity: 1, duration: .4, stagger: .12 }, 1.6)
      .to([...label('Discard'), ...label('Make new'), ...label('Replaced')], { opacity: 1, duration: .4, stagger: .08 }, 1.65)
      .to(repair, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 1.9)
      .to([...byStep(3), ...byStep(4)].filter(n => n.classList.contains('p-node--g')), { opacity: 1, duration: .35, stagger: .25 }, 2.2)
      .to([...label('Repair'), ...label('Keep using'), ...label('Repaired')], { opacity: 1, duration: .4, stagger: .1 }, 2.25);
  }

  if (reduce) return;

  // staircase rises step by step as it arrives
  const steps = $$('[data-ladder] li');
  gsap.set(steps, { opacity: 0, y: 24 });
  ScrollTrigger.create({
    trigger: '[data-ladder]', start: 'top 78%', once: true,
    onEnter: () => gsap.to(steps, { opacity: 1, y: 0, duration: .7, stagger: .12, ease: 'power3.out' })
  });

  $$('[data-drift]').forEach(img => {
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
})();
