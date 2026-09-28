/* EDIO — About page
   Portrait intro → heading reveals → the phase track fills to "today" → India lights on the map
   → team photo drifts. Everything is readable without GSAP. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays, revealHeadings } = window.EDIO;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const title = $('.ab-title');
  const titleWords = split(title);
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('is-intro'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  revealHeadings(title, reduce);

  /* ---------- Intro ---------- */
  if (reduce || window.scrollY > window.innerHeight * .4) {
    html.classList.remove('is-intro');
  } else {
    const fades = $$('[data-ab-fade]');
    const plate = $('.portrait-plate');
    const img = $('[data-portrait-img]');
    const d = lineDelays(titleWords);
    gsap.set(titleWords, { yPercent: 105 });
    gsap.set(fades, { opacity: 0, y: 12 });
    gsap.set('.al-h', { scaleX: 0 });
    gsap.set('.al-v', { scaleY: 0 });
    gsap.set(plate, { clipPath: 'inset(0% 0% 0% 100%)' });
    gsap.set(img, { scale: 1.06 });
    html.classList.remove('is-intro');

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('.al-h', { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0)
      .to('.al-v', { scaleY: 1, duration: 1, stagger: .08, ease: 'expo.inOut' }, .05)
      .to(fades[0], { opacity: 1, y: 0, duration: .5 }, .1)
      .to(titleWords, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: i => d[i] }, .25)
      .to(plate, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' }, .35)
      .to(img, { scale: 1, duration: 1.8, ease: 'power2.out' }, .35)
      .to(fades.slice(1), { opacity: 1, y: 0, duration: .7 }, .85)
      .add(() => gsap.set(plate, { clearProps: 'clipPath' }));
  }

  if (reduce) return;

  /* ---------- Phase track: fills to "today", then phases light in order ---------- */
  const track = $('[data-track]');
  const phases = $$('.ph', track);
  gsap.set(phases, { opacity: 0, y: 14 });
  gsap.set(track, { '--p': 0 });
  ScrollTrigger.create({
    trigger: track, start: 'top 75%', once: true,
    onEnter: () => gsap.timeline()
      .to(phases, { opacity: 1, y: 0, duration: .55, stagger: .09, ease: 'power3.out' }, 0)
      .to(track, { '--p': 1, duration: 1.3, ease: 'power2.inOut' }, .15)
  });

  /* ---------- Map: land settles, India lights, the confirmed dot arrives ---------- */
  const map = $('[data-map]');
  const india = $('.india', map);
  const cities = $$('.city', map);
  gsap.set(india, { opacity: 0 });
  gsap.set(cities, { opacity: 0 });
  ScrollTrigger.create({
    trigger: map, start: 'top 75%', once: true,
    onEnter: () => gsap.timeline()
      .to(cities.filter(c => !c.classList.contains('city--on')), { opacity: 1, duration: .5, stagger: .12 }, .1)
      .to(india, { opacity: 1, duration: .9, ease: 'power2.out' }, .3)
      .to(cities.filter(c => c.classList.contains('city--on')), { opacity: 1, duration: .5 }, .9)
  });

  /* ---------- Team photo drifts ---------- */
  gsap.fromTo('[data-team-img]', { yPercent: -2.5 }, { yPercent: 2.5, ease: 'none', scrollTrigger: { trigger: '[data-team]', start: 'top bottom', end: 'bottom top', scrub: true } });
})();
