'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { KEEP_NEIGHBOURS, RENDER_NEIGHBOURS } from '@/lib/config';

// Cap the backing store so tall pages stay within mobile memory limits.
const dpr = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);
const MAX_CANVAS_PX = 4096;

/**
 * One page of the newsletter, contained within the screen so the whole page is
 * always visible. The frame is sized in px rather than by CSS `object-fit` so
 * the shadow and rounded corners hug the page itself, not the letterbox.
 */
export default function PageSlide({ page, index, total, distance, registerFrame }) {
  // Two different thresholds: a page starts drawing when it is about to be
  // needed, and is only released once it is further out than that. Collapsing
  // them into one would thrash the canvas on every single flip.
  const shouldRender = distance <= RENDER_NEIGHBOURS;
  const keepAlive = distance <= KEEP_NEIGHBOURS;

  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const taskRef = useRef(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    registerFrame(index, frameRef.current);
    return () => registerFrame(index, null);
  }, [index, registerFrame]);

  // Contain the page within the stage: whichever axis runs out first wins.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      const boxW = stage.clientWidth;
      const boxH = stage.clientHeight;
      if (!boxW || !boxH) return;

      const w = Math.round(Math.min(boxW, boxH * page.ratio));
      setSize((prev) => (prev.w === w ? prev : { w, h: Math.round(w / page.ratio) }));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [page.ratio]);

  // Draw at the frame's on-screen width times DPR, so the page stays sharp
  // without holding a needlessly large bitmap.
  useEffect(() => {
    if (!shouldRender || !size.w) return undefined;

    let cancelled = false;

    (async () => {
      let scale = (size.w * dpr()) / page.width;
      const projected = Math.max(page.width, page.height) * scale;
      if (projected > MAX_CANVAS_PX) scale *= MAX_CANVAS_PX / projected;

      const viewport = page.page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Newsletter page ${page.n} of ${total}`);

      const task = page.page.render({
        canvasContext: canvas.getContext('2d', { alpha: false }),
        viewport,
      });
      taskRef.current = task;

      try {
        await task.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') throw err;
        return;
      }

      if (cancelled) return;

      const frame = frameRef.current;
      if (!frame) return;

      canvasRef.current?.remove();
      canvasRef.current = canvas;
      frame.appendChild(canvas);
      setReady(true);
      taskRef.current = null;
    })();

    return () => {
      cancelled = true;
      taskRef.current?.cancel();
      taskRef.current = null;
    };
  }, [shouldRender, size.w, page, total]);

  // Released once the page is far enough away to keep memory down.
  useEffect(() => {
    if (keepAlive) return;
    taskRef.current?.cancel();
    taskRef.current = null;
    canvasRef.current?.remove();
    canvasRef.current = null;
    setReady(false);
  }, [keepAlive]);

  return (
    <section
      className="slide"
      role="group"
      aria-roledescription="page"
      aria-label={`Page ${page.n} of ${total}`}
    >
      <div className="stage" ref={stageRef}>
        <div
          className={ready ? 'frame ready' : 'frame'}
          ref={frameRef}
          style={size.w ? { width: `${size.w}px`, height: `${size.h}px` } : undefined}
        >
          <div className="skeleton" />
        </div>
      </div>
    </section>
  );
}
