# Quarter at a Glance — IL Newsletter (May–July 2026)

A mobile-first web reader for the Infinity Learn quarterly newsletter, built with
**Next.js 14 (App Router)** and React.

**Live:** https://il-newsletter-q2-2026.vercel.app/

The original PDF is embedded as-is and rendered inline with PDF.js. Nothing is
re-typeset or converted to images, so what you see is the actual document, pixel
for pixel, at any screen size.

---

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | `next lint` |
| `postinstall` | Copies the PDF.js worker into `public/` — runs automatically |

---

## Packages

| Package | Version | Why |
| --- | --- | --- |
| `next` | 14.2.15 | App Router, metadata API, static prerender |
| `react` / `react-dom` | 18.3.x | Required by Next 14 |
| `pdfjs-dist` | 4.10.38 | Renders the PDF to canvas (Apache-2.0, Mozilla) |

That is the whole dependency list — no UI kit, no state library, no animation
library. The card transition is CSS, and the scroll behaviour is native
scroll-snap; both are described below.

### The PDF.js worker

PDF.js offloads parsing and rasterising to a web worker, which must be fetched as
a URL at runtime and therefore cannot be bundled. `scripts/copy-pdf-worker.mjs`
copies it from `node_modules` into `public/` on every install, so it is always
pinned to the installed `pdfjs-dist` version — **a library/worker version mismatch
throws at load.** For that reason `public/pdf.worker.min.mjs` is generated, not
committed, and is listed in `.gitignore`.

---

## Structure

```
app/
  layout.jsx        Metadata, viewport, <html>/<body>
  page.jsx          Server component — prerendered heading + <Reader/>
  globals.css       All styling, including the card keyframes
components/
  Reader.jsx        Loads the PDF, swaps status card for the deck
  Deck.jsx          The vertical deck; decides which pages hold a canvas
  PageSlide.jsx     One page: sizing, canvas rendering, release
  ProgressBar.jsx   Story-style segments
  NavButtons.jsx    Prev/next chevrons
  Onboarding.jsx    First-run "swipe up" card
  LoadingStatus.jsx Loading, error and unsupported states
hooks/
  usePdfDocument.js Loads the document, returns one descriptor per page
  useDeck.js        Index, eased scroll, and the card scrub
lib/
  config.js         Everything that changes when a new issue ships
```

Only `app/page.jsx` and `app/layout.jsx` are server components. Everything under
`components/` is `'use client'` — the reader is entirely browser-side, because
canvas rendering has no meaningful server equivalent.

### Where state lives, and where it deliberately does not

`useDeck` tracks the current page in React state, because a handful of components
re-render when it changes. **The card transition does not go through state.** It
runs on every scroll frame, and re-rendering 14 slides at that rate would drop
frames — so slides register their frame element via `registerFrame`, and the
scrub writes `animation-delay` straight to the DOM through refs. This is the one
place where reaching past React is the correct call, not a shortcut.

---

## Reading experience

An Inshorts-style vertical deck: **one page per screen, swipe up for the next.**

- **One page per gesture** — CSS scroll-snap with `scroll-snap-stop: always`, so a
  hard flick still advances exactly one page.
- **Whole page always visible** — each page is contained within the screen, never
  cropped, so no pinch-and-pan is needed to read a spread.
- **Card transition** — the outgoing page dims, tilts back and lifts away while the
  incoming one rises from below, scaling and un-tilting into place under a 1600px
  perspective.
- **Story-style progress** — one segment per page; tap any segment to jump.
- **First-run instruction** — a "swipe up to read" card on the first visit only,
  remembered in `localStorage`.
- Chevron buttons, arrow keys, `Space`, `PageUp`/`PageDown` and `Home`/`End` all
  work for non-touch users.

---

## Design decisions worth knowing

Each of these looks like it could be simplified, and each has a reason.

**PDF.js instead of `<embed>` or `<iframe>`.** Native PDF embedding is unreliable on
mobile — iOS Safari and most Android browsers either refuse to render an embedded
PDF inline or force a download. PDF.js renders to canvas, so one implementation
behaves identically on phone, tablet and desktop.

**`pdfjs-dist` is imported dynamically inside an effect.** It touches browser
globals at module scope, so a static import breaks the server render.

**The transition is driven by scroll position, not a timer.** That is what makes it
track the finger and reverse if you abandon a drag mid-way. One `@keyframes` set
feeds two delivery mechanisms so they cannot drift apart: browsers with
scroll-driven animations (`animation-timeline: view()`) run it on the compositor;
everywhere else — notably iOS before Safari 26 — the same keyframes are declared
`paused` and scrubbed via a negative `animation-delay`. A `CSS.supports` check picks
exactly one path.

Because of that, the transition's speed *is* the speed of your finger and cannot be
slowed directly. So buttons, keys and progress taps run their own 700ms eased scroll
instead of native `behavior: smooth`, which settles too fast to see. Mandatory
scroll-snap would yank a per-frame tween to the nearest page, so snap is suspended
during that tween — and restored on completion, on interrupt, on resize, and when
the tab is hidden (rAF stops there). **Snap must never be left switched off**; that
would silently break swiping.

**Which pages hold a canvas is decided in `Deck`, not by an `IntersectionObserver`.**
Observer callbacks are throttled or skipped entirely in background and embedded
tabs, which left every page blank in testing.

**Two separate distance thresholds.** A page starts drawing at
`RENDER_NEIGHBOURS` and is only released beyond `KEEP_NEIGHBOURS`. Collapsing them
into one would destroy and redraw the canvas on every single flip.

**Range requests, not a smaller PDF.** The viewer runs with `disableAutoFetch`, so
it pulls only the byte ranges it needs and the first page paints after a few hundred
KB instead of the full 4.1MB. This is why the PDF is deliberately **not preloaded** —
preloading would fetch the whole file and defeat it. Hosts that don't answer with
`206` simply stream the file as before.

**A card slide, not a 3D page flip.** On full-bleed poster pages a flip reads as
heavy and disorienting, and costs far more to keep smooth on low-end phones than a
translate/scale/opacity card.

Under `prefers-reduced-motion` the card motion is dropped entirely rather than
compressed into a 0.01s flash.

---

## A note on the PDF's file size

The PDF is 4.1MB and **cannot usefully be compressed without quality loss.** Every
page is a single full-page JPEG at 1520×2688, so ~97% of the file is already-lossy
image data with almost no structural overhead to strip. Lossless JPEG re-encoding
(`jpegtran -optimize -progressive`, verified pixel-identical) was measured at only
**1.3%** — not worth rebuilding the file for. Anything beyond that means re-encoding
or downsampling, which visibly softens the artwork.

Range requests solve the real problem instead: time-to-first-page, rather than
total bytes.

---

## Deployment

Vercel auto-detects Next.js — no configuration needed beyond what is committed.
`next.config.mjs` sets the response headers the static build previously kept in
`vercel.json` (content types, `Content-Disposition: inline` for the PDF, immutable
caching for the PDF and worker). Every push to `main` redeploys.

The page is statically prerendered: the shell, metadata and the screen-reader
heading are HTML, and only the reader itself runs client-side.

---

## Publishing next quarter's issue

Almost everything lives in `lib/config.js`:

1. Drop the new PDF into `public/` and point `PDF_URL` at it.
2. Update `TITLE` and `DESCRIPTION` — metadata, OG and Twitter tags all derive
   from them.
3. Regenerate `public/og-image.jpg` at 1200×630 from the new cover.
4. Bump `SEEN_KEY` so returning readers see the swipe instruction again.
5. Push to `main`.

Page count, page dimensions and aspect ratio are read from the PDF at runtime, so
nothing else needs touching if the format changes. If a custom domain is attached,
change `SITE_URL` too — link previews resolve against absolute URLs.

---

## Licence

PDF.js is © Mozilla Foundation, Apache-2.0. The newsletter content and Infinity
Learn branding are proprietary.
