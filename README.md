# EDIO website

Static site: plain HTML, CSS and JavaScript, with no build step. Open `index.html` directly or serve the folder
(`npx serve .`) and open it in a browser.

## Pages

| Page | File | Script |
| --- | --- | --- |
| Home | `index.html` | `assets/js/home.js` |
| Intelligence | `intelligence.html` | `assets/js/intelligence.js` |
| Hardware (SmartClone) | `hardware.html` | `assets/js/hardware.js` |
| Impact | `impact.html` | `assets/js/impact.js` |
| About | `about.html` | `assets/js/about.js` |
| Contact | `contact.html` | `assets/js/contact.js` |

Each page loads `assets/css/base.css` plus its own stylesheet (`assets/css/<page>.css`, `home.css` for the homepage).

## Shared parts

- `assets/css/base.css`: colour and type tokens, header, buttons, status line (`.sys`), status lights (`.led`),
  diagnostic markers, closing section, footer, and the `[data-rise]` scroll reveal.
- `assets/js/site.js`: header state, mobile menu, and helpers on `window.EDIO`: `split` and `lineDelays` for the
  masked headline reveals, and `revealHeadings` for section headings marked `data-split`.
- `assets/js/vendor/`: GSAP and ScrollTrigger, used for scroll choreography. Every page still works if they fail to load.

The header and footer markup is repeated in each HTML file. Change it in all six files together.

## Conventions

- Motion respects `prefers-reduced-motion`. Each page adds `is-intro` to `<html>` in `<head>` so the first frame is held
  until its intro runs, with a 4-second failsafe.
- Copy comes from the previous EDIO site. Anything illustrative or in development is labelled on the page
  ("Illustrative", "In development", "Modelled estimate"). Keep it that way.
- Photos live in `assets/img/`, converted to WebP where possible. Originals are in `_source/`.

## Things to wire up

- **Contact form** (`contact.js`): with no backend, it opens WhatsApp or email with the message written out.
  To deliver to an inbox, post the composed message to a form service in the `submit` handler.
- **Impact · verified figures** (`impact.html`, `.ev--verified`): empty on purpose until there is evidence to publish.
- **Social previews:** `og:image` is a relative path (`assets/img/og/edio-share.jpg`). Most link-preview services need an
  absolute URL, so prefix it with the live domain on deploy.
- **Map** (`about.html`): the SVG is generated from `_source/uploads/assets/js/map-geo.js` (Natural Earth, public domain).
  Mark a new confirmed location by moving the `city--on` class and updating the legend.
