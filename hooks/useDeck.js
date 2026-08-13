'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLIDE_MS } from '@/lib/config';

/**
 * Owns everything about moving through the deck: which page is in frame, the
 * eased scroll used by buttons and keys, and the per-frame scrub that drives
 * the card transition on browsers without scroll-driven animations.
 *
 * The scrub writes to the DOM through refs rather than through state on
 * purpose — it runs on every scroll frame, and re-rendering 14 slides at that
 * rate would drop frames.
 */
export default function useDeck(pageCount) {
  const deckRef = useRef(null);
  const framesRef = useRef(new Map());
  const glideRef = useRef(null);
  const tickingRef = useRef(false);
  const indexRef = useRef(0);
  const countRef = useRef(pageCount);

  const [index, setIndexState] = useState(0);

  countRef.current = pageCount;

  const setIndex = useCallback((i) => {
    indexRef.current = i;
    setIndexState(i);
  }, []);

  // Slides register their .frame element so the scrub can reach it directly.
  const registerFrame = useCallback((i, el) => {
    if (el) framesRef.current.set(i, el);
    else framesRef.current.delete(i);
  }, []);

  // Where the browser supports scroll-driven animations the CSS already runs
  // the card off scroll position, and JS must keep its hands off.
  const scrollDrivenRef = useRef(false);
  useEffect(() => {
    scrollDrivenRef.current = window.CSS?.supports?.('animation-timeline', 'view()') ?? false;
  }, []);

  const paint = useCallback(() => {
    if (scrollDrivenRef.current) return;

    const deck = deckRef.current;
    if (!deck) return;

    const h = deck.clientHeight;
    if (!h) return;

    const pos = deck.scrollTop / h;

    framesRef.current.forEach((el, i) => {
      // 0 when this page is settled in frame, +1 one screen below, -1 above.
      const d = i - pos;

      if (Math.abs(d) > 1.1) {
        if (el.style.animationDelay) el.style.animationDelay = '';
        return;
      }

      // Map [+1 .. -1] onto the 0s..1s keyframe timeline.
      const p = Math.min(1, Math.max(0, (1 - d) / 2));
      el.style.animationDelay = `${-p}s`;
    });
  }, []);

  const stopGlide = useCallback(() => {
    if (!glideRef.current) return;
    cancelAnimationFrame(glideRef.current.raf);
    clearTimeout(glideRef.current.safety);
    if (deckRef.current) deckRef.current.style.scrollSnapType = '';
    glideRef.current = null;
  }, []);

  const goTo = useCallback(
    (i, animate = true) => {
      const deck = deckRef.current;
      if (!deck || !countRef.current) return;

      const target = Math.max(0, Math.min(countRef.current - 1, i));
      const to = target * deck.clientHeight;

      // A long jump (Home/End, a distant progress segment) would only blur past
      // pages that have been unloaded, so take those instantly.
      const far = Math.abs(target - indexRef.current) > 2;

      stopGlide();

      if (target !== indexRef.current) setIndex(target);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!animate || far || reduced) {
        deck.scrollTop = to;
        paint();
        return;
      }

      const from = deck.scrollTop;
      const dist = to - from;
      if (!dist) return;

      const started = performance.now();

      // Mandatory snap would yank a per-frame tween straight to the nearest
      // page, so it is suspended for the duration and restored at the end.
      deck.style.scrollSnapType = 'none';

      // Leaving snap switched off would silently break swiping, so restoring it
      // must not depend on rAF running — which it does not in a hidden or
      // heavily throttled tab. Timers still fire there, so this is the backstop.
      const settle = () => {
        if (!glideRef.current) return;
        cancelAnimationFrame(glideRef.current.raf);
        clearTimeout(glideRef.current.safety);
        glideRef.current = null;
        deck.style.scrollSnapType = '';
        deck.scrollTop = to;
      };

      const step = (now) => {
        const t = Math.min(1, (now - started) / GLIDE_MS);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        deck.scrollTop = from + dist * eased;
        paint();

        if (t < 1) {
          if (glideRef.current) glideRef.current.raf = requestAnimationFrame(step);
        } else {
          settle();
        }
      };

      glideRef.current = {
        raf: requestAnimationFrame(step),
        safety: setTimeout(settle, GLIDE_MS + 400),
      };
    },
    [paint, setIndex, stopGlide],
  );

  // Scroll: track the page in frame and scrub the card.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return undefined;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        tickingRef.current = false;

        const h = deck.clientHeight;
        if (!h) return;

        paint();

        const i = Math.round(deck.scrollTop / h);
        if (i !== indexRef.current) setIndex(i);
      });
    };

    deck.addEventListener('scroll', onScroll, { passive: true });

    // Any real input wins over an in-flight glide; restoring snap lets the
    // browser settle to the nearest page from wherever the tween had reached.
    const interrupts = ['pointerdown', 'touchstart', 'wheel'];
    for (const ev of interrupts) deck.addEventListener(ev, stopGlide, { passive: true });

    return () => {
      deck.removeEventListener('scroll', onScroll);
      for (const ev of interrupts) deck.removeEventListener(ev, stopGlide);
    };
  }, [paint, setIndex, stopGlide]);

  // Resize: keep the page in frame pinned, then re-measure.
  useEffect(() => {
    let t;

    const onResize = () => {
      stopGlide();
      clearTimeout(t);
      t = setTimeout(() => {
        const deck = deckRef.current;
        if (!deck) return;
        deck.scrollTop = indexRef.current * deck.clientHeight;
        paint();
      }, 180);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        paint();
        return;
      }
      // rAF is suspended while hidden; abandoning the tween here keeps snap
      // from being left switched off.
      stopGlide();
      const deck = deckRef.current;
      if (deck) deck.scrollTop = indexRef.current * deck.clientHeight;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      stopGlide();
    };
  }, [paint, stopGlide]);

  const onKeyDown = useCallback(
    (e) => {
      const steps = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };

      if (e.key in steps) {
        e.preventDefault();
        goTo(indexRef.current + steps[e.key]);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(countRef.current - 1);
      }
    },
    [goTo],
  );

  return { deckRef, registerFrame, index, goTo, paint, onKeyDown };
}
