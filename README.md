# Quarter at a Glance — IL Newsletter (May–July 2026)

A mobile-responsive web wrapper around the Infinity Learn quarterly newsletter PDF.

**Live:** https://il-newsletter-q2-2026.vercel.app/

The original PDF is embedded as-is and rendered inline with [PDF.js](https://mozilla.github.io/pdf.js/) — nothing is re-typeset or converted to images, so what you see is the actual document, pixel for pixel, at any screen size.

## Why PDF.js instead of `<embed>` / `<iframe>`

Native PDF embedding is unreliable on mobile: iOS Safari and most Android browsers either refuse to render an embedded PDF inline or force a download. PDF.js renders the real PDF to canvas, so a single implementation works identically on phone, tablet, and desktop.

## Reading experience

An Inshorts-style vertical deck: **one page per screen, swipe up for the next**.

- **One page per gesture** — CSS scroll-snap with `scroll-snap-stop: always`, so a hard flick still advances exactly one page.
- **Whole page always visible** — each page is contained within the screen, never cropped, so no pinch-and-pan is needed to see a spread.
- **Card transition** — the outgoing page dims, tilts back and lifts away while the incoming one rises from below, scaling and un-tilting into place under a 1600px perspective. Tied to the swipe rather than played on a fixed timer, so it tracks the finger and reverses if you change your mind mid-drag.
- **Story-style progress** — 14 segments across the top track position; tap any segment to jump.
- **First-run instruction** — a "swipe up to read" card on the first visit only, remembered in `localStorage`.
- Chevron buttons, arrow keys, `Space`, `PageUp`/`PageDown`, and `Home`/`End` all work for non-touch users.

### How the transition is driven

One `@keyframes` set feeds two delivery mechanisms, so the motion can never drift
between them:

- Browsers with **scroll-driven animations** (`animation-timeline: view()`) run it
  on the compositor, locked to scroll position through momentum scrolling.
- Everywhere else — notably iOS before Safari 26 — the same keyframes are declared
  `paused` and scrubbed by setting a negative `animation-delay` from the existing
  rAF-throttled scroll handler.

A `CSS.supports` check picks one path, never both.

Because the motion follows scroll position, its speed *is* the speed of your finger —
it cannot be slowed directly. So buttons, arrow keys and progress-segment taps run
their own 700ms eased scroll (`easeOutCubic`) instead of native `behavior: smooth`,
which settles too fast to read. Mandatory scroll-snap would yank a per-frame tween
straight to the nearest page, so snap is suspended for the tween and restored at the
end — and also on interrupt (`pointerdown`/`touchstart`/`wheel`), on resize, and when
the tab is hidden, since rAF stops there. Snap is never left switched off. Jumps of
more than two pages skip the animation, as they would only blur past unloaded pages. A 3D page-flip was considered and
rejected: on full-bleed poster pages it reads as heavy and disorienting, and it costs
far more to keep smooth on low-end phones than a translate/scale/opacity card.

Under `prefers-reduced-motion` the card motion is dropped entirely rather than
compressed into a 0.01s flash.

## Rendering

- Each page is rasterised at its on-screen width × device pixel ratio (capped 2×) and re-rendered after a resize or orientation change, so it stays sharp without wasting memory.
- Only the current page and its immediate neighbours are held as canvases; the rest are released. A flip in either direction lands on an already-drawn page.
- **Range requests** — the viewer runs with `disableAutoFetch`, so it pulls only the byte ranges it needs. The first page paints after a few hundred KB instead of the full 4.1MB. Hosts that do not answer with `206` simply stream the whole file as before. Note this is why there is deliberately no `rel=preload` for the PDF.
- If the inline viewer can't load at all, the page falls back to a direct link to the PDF.

Rendering is driven by scroll events rather than `IntersectionObserver`, whose callbacks are throttled or skipped entirely in background and embedded tabs.

## A note on file size

The PDF is 4.1MB and **cannot usefully be compressed without quality loss**: every page is a single full-page JPEG at 1520×2688, so ~97% of the file is already-lossy image data with almost no structural overhead to strip. Lossless JPEG re-encoding (`jpegtran -optimize -progressive`) was measured at only **1.3%** — not worth rebuilding the file for. Anything larger means re-encoding or downsampling, which visibly degrades the artwork.

Range requests solve the real problem instead: time-to-first-page, rather than total bytes.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole site — markup, styles, and viewer logic |
| `quarter-at-a-glance-may-jul-2026.pdf` | The source newsletter, unmodified |
| `og-image.jpg` | 1200×630 social preview card |
| `vendor/` | Vendored PDF.js 4.10.38 (no CDN dependency) |
| `vercel.json` | Content types and caching — no build step |

Every tracked file is needed at runtime. The two `vendor/` files are the whole of
PDF.js: `pdf.min.mjs` is the library and `pdf.worker.min.mjs` is the worker it
requires; neither can be trimmed further for an image-only PDF.

## Local preview

Any static file server works — the viewer needs HTTP, not `file://`, because it loads an ES module and a worker.

```bash
python3 -m http.server 8777
```

Then open http://localhost:8777.

## Deployment

Hosted on **Vercel** as a static site — there is no build step, `vercel.json` only
sets content types and caching (long-lived for the PDF and vendored JS, revalidated
for the HTML).

Import the repo once at [vercel.com/new](https://vercel.com/new), leaving the
framework preset as **Other** and the build command empty. Every push to `main`
then redeploys automatically.

To deploy from the CLI instead:

```bash
npx vercel --prod
```

The absolute `og:image` and `canonical` URLs in `index.html` point at the Vercel
domain, so that is the deployment to share.
