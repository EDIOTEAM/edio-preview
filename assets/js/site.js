/* EDIO — Shared site behaviour (all pages)
   Header state, mobile menu, word-split helpers, lightweight scroll reveals.
   Runs without GSAP; page scripts read helpers from window.EDIO. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Header + menu ---------- */
  const header = $('[data-header]');
  const menuBtn = $('[data-menu-btn]');
  const mobileNav = $('[data-mobile-nav]');

  const setScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 24 || menuBtn.getAttribute('aria-expanded') === 'true');
  setScrolled();
  window.addEventListener('scroll', setScrolled, { passive: true });

  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    setScrolled();
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) menuBtn.click(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { menuBtn.click(); menuBtn.focus(); } });

  /* ---------- Word split for masked reveals ---------- */
  function split(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    return $$('.w > span', el);
  }
  // stagger per visual line, then per word
  function lineDelays(spans, perLine = .09, perWord = .025) {
    let top = null, line = -1, idx = 0;
    return spans.map(s => {
      const t = s.parentElement.offsetTop;
      if (t !== top) { top = t; line++; idx = 0; }
      return line * perLine + idx++ * perWord;
    });
  }

  /* ---------- Scroll reveals: [data-rise] fades up once; [data-rise-stagger] children in sequence ---------- */
  const rise = $$('[data-rise]');
  if (rise.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const parent = el.closest('[data-rise-stagger]');
        const i = parent ? $$('[data-rise]', parent).indexOf(el) : 0;
        el.style.transitionDelay = (i * 70) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    rise.forEach(el => io.observe(el));
  } else {
    rise.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Section headings: masked word reveal, once, as each arrives (needs GSAP + ScrollTrigger) ---------- */
  function revealHeadings(skip, reduce) {
    $$('[data-split]').forEach(el => {
      if (el === skip) return;
      const words = split(el);
      if (reduce) return;
      const d = lineDelays(words, .08, .02);
      gsap.set(words, { yPercent: 105 });
      ScrollTrigger.create({
        trigger: el, start: 'top 86%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1, ease: 'expo.out', delay: i => d[i] })
      });
    });
  }

  window.EDIO = { $, $$, split, lineDelays, revealHeadings, header };
})();
