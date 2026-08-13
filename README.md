# Quarter at a Glance — IL Newsletter (May–July 2026)

A mobile-responsive web wrapper around the Infinity Learn quarterly newsletter PDF.

**Live:** https://isaee-xyz.github.io/il-newsletter-q2-2026/

The original PDF is embedded as-is and rendered inline with [PDF.js](https://mozilla.github.io/pdf.js/) — nothing is re-typeset or converted to images, so what you see is the actual document, pixel for pixel, at any screen size.

## Why PDF.js instead of `<embed>` / `<iframe>`

Native PDF embedding is unreliable on mobile: iOS Safari and most Android browsers either refuse to render an embedded PDF inline or force a download. PDF.js renders the real PDF to canvas, so a single implementation works identically on phone, tablet, and desktop.

## What it does

- **Responsive rendering** — each page is rasterised at the container's current width × device pixel ratio (capped at 2×), so pages stay sharp on retina screens without wasting memory. Pages re-render after a resize or orientation change.
- **Fit-to-viewport on desktop** — this is a tall story-format PDF, so on screens ≥ 860px each page is capped to the viewport height and a whole page is visible at once.
- **Lazy rendering** — only pages within ~1.5 viewports are held in memory; the rest are released. That keeps a 14-page, 4MB document usable on low-end phones.
- **No layout shift** — placeholders are sized from the real PDF page box before rendering starts.
- **Graceful degradation** — if the inline viewer can't load, the page falls back to a direct link to the PDF.

Rendering is driven by scroll events rather than `IntersectionObserver`, whose callbacks are throttled or skipped entirely in background and embedded tabs.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole site — markup, styles, and viewer logic |
| `quarter-at-a-glance-may-jul-2026.pdf` | The source newsletter, unmodified |
| `og-image.jpg` | 1200×630 social preview card |
| `vendor/` | Vendored PDF.js 4.10.38 (no CDN dependency) |

## Local preview

Any static file server works — the viewer needs HTTP, not `file://`, because it loads an ES module and a worker.

```bash
python3 -m http.server 8777
```

Then open http://localhost:8777.

## Deployment

Served by GitHub Pages from the `main` branch root. Push to `main` to publish.
