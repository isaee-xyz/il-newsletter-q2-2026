// Single source of truth for anything that changes when a new issue ships.
// Page count, page dimensions and aspect ratio are all read from the PDF at
// runtime, so they deliberately do not appear here.

export const SITE_URL = 'https://il-newsletter-q2-2026.vercel.app';

export const PDF_URL = '/quarter-at-a-glance-may-jul-2026.pdf';

export const TITLE = 'Quarter at a Glance -May to July 2026';

export const DESCRIPTION =
  'Take a look back at the quarter gone by—where ideas turned into action, and action created impact.';

export const OG_IMAGE = '/og-image.jpg';

// Bump this when a new issue ships so returning readers see the swipe
// instruction again.
export const SEEN_KEY = 'il-newsletter-q2-2026:onboarded';

// How far the eased scroll used by buttons, keys and progress taps runs for.
// Native `behavior: smooth` settles too fast to read the card transition.
export const GLIDE_MS = 700;

// Pages kept as live canvases either side of the current one, so a flip in
// either direction lands on an already-drawn page.
export const RENDER_NEIGHBOURS = 1;

// Beyond this the canvas is released to keep memory down on low-end phones.
export const KEEP_NEIGHBOURS = 2;
