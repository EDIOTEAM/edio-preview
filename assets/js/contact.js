/* EDIO — Contact page
   A static site has no inbox of its own, so the form writes the enquiry out and hands it to the
   visitor's WhatsApp or email app, addressed to EDIO. Nothing claims "sent" that wasn't. */
(() => {
  'use strict';

  const html = document.documentElement;
  const { $, $$, split, lineDelays } = window.EDIO;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const WHATSAPP = '918925927588';
  const EMAIL = 'support@edio.in';

  /* ---------- Form ---------- */
  const form = $('[data-form]');
  const roles = $$('input[name="role"]', form);
  const branches = $$('[data-step-branch]', form);
  const status = $('[data-status]', form);
  const statusLabel = $('[data-status-label]', status);
  const statusText = $('[data-status-text]', status);
  const copyBtn = $('[data-copy]', status);
  const statusLink = $('[data-status-link]', status);
  let lastMessage = '';

  function showBranch() {
    const picked = roles.find(r => r.checked);
    const want = picked ? picked.dataset.branch : null;
    branches.forEach(b => {
      const on = b.dataset.stepBranch === want;
      b.hidden = !on;
      b.disabled = !on;   // hidden branch never reaches the message
    });
  }
  roles.forEach(r => r.addEventListener('change', () => { showBranch(); clearError('role'); }));

  // deep link: contact.html?role=smartclone
  const pre = new URLSearchParams(location.search).get('role');
  const preRole = pre && roles.find(r => r.value === pre);
  if (preRole) preRole.checked = true;
  showBranch();

  function setError(key, on) {
    const err = $(`[data-err="${key}"]`, form);
    if (err) err.hidden = !on;
    const input = key === 'role' ? null : form.elements[key];
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  const clearError = key => setError(key, false);
  ['name', 'contact'].forEach(k => form.elements[k].addEventListener('input', () => clearError(k)));

  function validate() {
    const bad = [];
    if (!roles.some(r => r.checked)) bad.push('role');
    if (!form.elements.name.value.trim()) bad.push('name');
    if (!form.elements.contact.value.trim()) bad.push('contact');
    ['role', 'name', 'contact'].forEach(k => setError(k, bad.includes(k)));
    if (bad.length) {
      const first = bad[0] === 'role' ? roles[0] : form.elements[bad[0]];
      first.focus({ preventScroll: true });
      first.closest('.step').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
    return !bad.length;
  }

  function compose() {
    const f = form.elements;
    const role = roles.find(r => r.checked);
    const lines = ['Hello EDIO — enquiry from the website.', ''];
    const add = (k, v) => { v = (v || '').trim(); if (v) lines.push(`${k}: ${v}`); };
    add('Who I am', role && role.nextElementSibling.textContent);
    add('Name', f.name.value);
    add('Contact', f.contact.value);
    add('Town / country', f.town.value);
    // a disabled <fieldset> disables its fields without setting their .disabled, so ask :disabled
    if (!f.repairs.matches(':disabled')) { add('Mostly repair', f.repairs.value); add('Repairs a month', f.volume.value); }
    if (!f.org.matches(':disabled')) { add('Organisation', f.org.value); add('Area of interest', f.area.value); }
    const msg = f.message.value.trim();
    if (msg) lines.push('', msg);
    return lines.join('\n');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const via = (e.submitter && e.submitter.value) || 'whatsapp';
    lastMessage = compose();
    // Neither app can report back, so the panel never claims anything was sent and always offers a real link.
    if (via === 'email') {
      const href = `mailto:${EMAIL}?subject=${encodeURIComponent('Enquiry from the EDIO website')}&body=${encodeURIComponent(lastMessage)}`;
      window.location.href = href;
      statusLabel.textContent = 'Written out for email';
      statusText.textContent = `If your email app opened, the message is addressed to ${EMAIL} — press send there and a person from the team will reply. If nothing opened, copy the message below and email it to ${EMAIL}.`;
      statusLink.href = href;
      statusLink.textContent = 'Open email again';
    } else {
      const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lastMessage)}`;
      window.open(href, '_blank', 'noopener');
      statusLabel.textContent = 'Written out for WhatsApp';
      statusText.textContent = 'Press send in WhatsApp and a person from the team will reply. If WhatsApp didn\'t open, use the link below.';
      statusLink.href = href;
      statusLink.textContent = 'Open WhatsApp with this message ↗';
    }
    copyBtn.textContent = 'Didn\'t open? Copy the message';
    status.hidden = false;
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lastMessage);
      copyBtn.textContent = `Copied — paste it to +91 89259 27588 or ${EMAIL}`;
    } catch {
      copyBtn.textContent = `Couldn't copy here. Write to ${EMAIL} or WhatsApp +91 89259 27588.`;
    }
  });

  /* ---------- Hero intro (short: this page is for doing, not watching) ---------- */
  const title = $('.ct-title');
  const words = split(title);
  if (!window.gsap || reduce || window.scrollY > 40) { html.classList.remove('is-intro'); return; }

  const fades = $$('[data-ct-fade]');
  const band = $('.ct-band-media');
  const bandImg = $('[data-ct-band-img]');
  const d = lineDelays(words);
  gsap.set(words, { yPercent: 105 });
  gsap.set(fades, { opacity: 0, y: 12 });
  gsap.set('.cl-h', { scaleX: 0 });
  gsap.set('.cl-v', { scaleY: 0 });
  gsap.set(band, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(bandImg, { scale: 1.08 });
  html.classList.remove('is-intro');

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.cl-h', { scaleX: 1, duration: .9, ease: 'expo.inOut' }, 0)
    .to('.cl-v', { scaleY: 1, duration: .9, stagger: .08, ease: 'expo.inOut' }, .05)
    .to(fades[0], { opacity: 1, y: 0, duration: .5 }, .1)
    .to(words, { yPercent: 0, duration: 1, ease: 'expo.out', delay: i => d[i] }, .25)
    .to(fades.slice(1), { opacity: 1, y: 0, duration: .6, stagger: .07 }, .6)
    .to(band, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' }, .45)
    .to(bandImg, { scale: 1, duration: 1.8, ease: 'power2.out' }, .45)
    .add(() => gsap.set(band, { clearProps: 'clipPath' }));
})();
