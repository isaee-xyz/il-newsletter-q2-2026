'use client';

import { useCallback } from 'react';
import NavButtons from '@/components/NavButtons';
import Onboarding from '@/components/Onboarding';
import PageSlide from '@/components/PageSlide';
import ProgressBar from '@/components/ProgressBar';
import useDeck from '@/hooks/useDeck';

/**
 * The vertical deck: one page per screen, swipe up for the next.
 *
 * Which pages hold a live canvas is decided here rather than by an
 * IntersectionObserver — observer callbacks are throttled or skipped entirely
 * in background and embedded tabs, which leaves pages blank.
 */
export default function Deck({ pages }) {
  const total = pages.length;
  const { deckRef, registerFrame, index, goTo, paint, onKeyDown } = useDeck(total);

  const focusDeck = useCallback(() => {
    deckRef.current?.focus({ preventScroll: true });
    paint();
  }, [deckRef, paint]);

  return (
    <>
      <ProgressBar total={total} index={index} onJump={goTo} />

      <div className="viewer">
        <div
          className="deck"
          ref={deckRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Newsletter pages, one page per screen"
          onKeyDown={onKeyDown}
        >
          {pages.map((page, i) => (
            <PageSlide
              key={page.n}
              page={page}
              index={i}
              total={total}
              distance={Math.abs(i - index)}
              registerFrame={registerFrame}
            />
          ))}
        </div>

        <NavButtons index={index} total={total} onGo={goTo} />

        <span className="pager" aria-live="polite">
          {index + 1} / {total}
        </span>

        <Onboarding total={total} onDismissed={focusDeck} />
      </div>
    </>
  );
}
