'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SEEN_KEY } from '@/lib/config';

const RiseChevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 15 7-7 7 7" />
  </svg>
);

/**
 * Shown once, on a reader's first visit. The check runs in an effect rather
 * than during render because localStorage does not exist on the server, and
 * reading it during render would desync the markup React hydrates against.
 */
export default function Onboarding({ total, onDismissed }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Private mode: show the instruction rather than fail.
    }
    if (!seen) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);

    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Nothing to do — it just shows again next time.
    }

    timerRef.current = setTimeout(() => {
      setVisible(false);
      onDismissed?.();
    }, 400);
  }, [leaving, onDismissed]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!visible) return null;

  return (
    <div className={leaving ? 'onboard gone' : 'onboard'} onClick={dismiss}>
      <div className="onboard-card" role="dialog" aria-modal="true" aria-labelledby="obTitle">
        <div className="swipe-icon" aria-hidden="true">
          <RiseChevron />
          <RiseChevron />
        </div>
        <h2 id="obTitle">Swipe up to read</h2>
        <p>
          One page at a time, like a story. {total} pages in this quarter&apos;s newsletter.
        </p>
        <button type="button" className="btn" onClick={dismiss} autoFocus>
          Got it
        </button>
      </div>
    </div>
  );
}
