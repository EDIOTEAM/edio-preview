/* EDIO — Intelligence page
   Hero intro → sticky story stage driven by the chapter in view (repair → capture → learn → loop)
   → people photos drift → layer rail fills. The stage itself is CSS-transitioned from data-ch,
   so it reverses cleanly on scroll-up and works without GSAP. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays, revealHeadings } = window.EDIO;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrowMQ = window.matchMedia('(max-width: 899px), (max-width: 1199px) and (orientation: portrait)');

  /* ---------- Story: active chapter + rail progress ---------- */
  const stage = $('[data-stage]');
  const chapters = $$('[data-chapter]');
  const rails = $$('[data-rail]');
  let current = -1;

  function setCh(i) {
    if (i === current) return;
    current = i;
    stage.dataset.ch = String(i);
    chapters.forEach((c, k) => c.classList.toggle('is-on', k === i));
    rails.forEach((r, k) => r.classList.toggle('is-on', k === i));
  }

  // "reading lines": a chapter becomes active when its heading reaches the switch line
  // (a little below centre beside the stage; below the docked stage on narrow screens)
  const heads = chapters.map(c => $('h2', c));
  let ticking = false;
  function update() {
    ticking = false;
    const H = window.innerHeight;
    const line = H * (narrowMQ.matches ? .82 : .62);
    const probe = H * (narrowMQ.matches ? .74 : .5);
    let active = 0;
    chapters.forEach((c, k) => {
      const r = c.getBoundingClientRect();
      rails[k].style.setProperty('--p', Math.min(1, Math.max(0, (probe - r.top) / r.height)).toFixed(3));
      if (heads[k].getBoundingClientRect().top <= line) active = k;
    });
    setCh(active);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------- Motion (GSAP) ---------- */
  const title = $('.in-title');
  const titleWords = split(title);
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('is-intro'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // headings reveal once as they arrive
  revealHeadings(title, reduce);

  if (reduce || window.scrollY > window.innerHeight * .4) {
    html.classList.remove('is-intro');
  } else {
    const fades = $$('[data-in-fade]');
    const media = $('.in-media');
    const img = $('[data-in-img]');
    const mini = $('[data-mini-case]');
    const miniRows = $$('.mini-head, dl > div', mini);
    const d = lineDelays(titleWords);
    gsap.set(titleWords, { yPercent: 105 });
    gsap.set(fades, { opacity: 0, y: 12 });
    gsap.set('.il-h', { scaleX: 0 });
    gsap.set('.il-v', { scaleY: 0 });
    gsap.set(media, { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(img, { scale: 1.08 });
    gsap.set(mini, { opacity: 0, y: 16 });
    gsap.set(miniRows, { opacity: 0, x: -8 });
    html.classList.remove('is-intro');

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('.il-h', { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0)
      .to('.il-v', { scaleY: 1, duration: 1, stagger: .08, ease: 'expo.inOut' }, .05)
      .to(fades[0], { opacity: 1, y: 0, duration: .5 }, .1)
      .to(titleWords, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: i => d[i] }, .3)
      .to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' }, .35)
      .to(img, { scale: 1, duration: 1.8, ease: 'power2.out' }, .35)
      .to(fades.slice(1), { opacity: 1, y: 0, duration: .6, stagger: .08 }, .85)
      // the case card lands last: the repair, already written down
      .to(mini, { opacity: 1, y: 0, duration: .6 }, 1.2)
      .to(miniRows, { opacity: 1, x: 0, duration: .4, stagger: .12 }, 1.35)
      .add(() => gsap.set(media, { clearProps: 'clipPath' }));
  }

  if (reduce) return;

  // hero hands over: photo drifts up a touch slower than the page
  gsap.to('[data-in-img]', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '[data-in-hero]', start: 'top top', end: 'bottom top', scrub: true } });

  // people photos drift inside their frames
  $$('[data-drift]').forEach(img => {
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // layer rail: fills to "now" as the section arrives
  const layerRail = $('[data-layer-rail]');
  gsap.fromTo(layerRail, { '--p': 0 }, { '--p': 1, ease: 'power2.out', duration: 1.2, scrollTrigger: { trigger: layerRail, start: 'top 80%', once: true } });
})();
