# EDIO website

Static site: plain HTML, CSS and JavaScript, with no build step. To preview it, double-click **`Preview site.bat`**.
It serves the folder at `http://localhost:8080` (using only Windows PowerShell) and opens the browser. Any static server
works too (`npx serve .`).

Don't judge the site by opening `index.html` directly: browsers block the 3D model over `file://`, so the hero falls back
to its still poster and the SmartClone section to a still render.

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

- Homepage sections 04–07 (`home-sections.js`) play on their own like short clips: each starts when it comes on
  screen, pauses off screen, plays once and holds its last frame, then shows a Replay button. Scrolling doesn't drive
  them. The hero's pinned scroll story and the bench section (`home.js`) are separate and still scroll-driven.
- After the hero, the homepage sits in one continuous background (`.atmos` in `index.html`, styled in
  `home-sections.css`): the hero's drifting cyan light, grain and vignette, fixed behind every section. Sections are
  transparent, with no borders between them.
- Homepage load: the page is held still (no scrolling) from the first frame until the SmartClone model has fully
  drawn and the headline has typed. The hold is set in the `<head>` script of `index.html`, released by `home.js`,
  and has a 30-second failsafe. The "EDIO / Repair intelligence system" boot line shows while the model loads.
- After the hero, cyan is toned down (`home-sections.css` sets a quieter `--cyan`/`--cyan-2` and softer glows on
  sections 04–09 and the footer). The hero keeps its approved colours.
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
