'use client';

import { useEffect, useState } from 'react';

/**
 * Loads a PDF and returns one descriptor per page.
 *
 * pdfjs-dist is imported dynamically because it touches browser globals at
 * module scope and would break the server render.
 */
export default function usePdfDocument(url) {
  const [state, setState] = useState({
    status: 'loading',
    percent: null,
    pages: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let doc = null;

    (async () => {
      let pdfjs;
      try {
        pdfjs = await import('pdfjs-dist');
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'unsupported', percent: null, pages: [], error: err });
        }
        return;
      }

      // Copied into public/ on install, pinned to the installed pdfjs-dist
      // version — see scripts/copy-pdf-worker.mjs.
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      try {
        // Each page of this PDF is one full-page JPEG, so the file is ~97%
        // image data and cannot be shrunk losslessly. Pull it in ranges
        // instead: the first page paints after a few hundred KB rather than
        // after all 4.1MB. Hosts that do not answer 206 stream it as before.
        const task = pdfjs.getDocument({
          url,
          disableAutoFetch: true,
          rangeChunkSize: 262144,
        });

        task.onProgress = ({ loaded, total }) => {
          if (!cancelled && total) {
            setState((s) => ({ ...s, percent: Math.round((loaded / total) * 100) }));
          }
        };

        doc = await task.promise;
        if (cancelled) return;

        const pages = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;

          const { width, height } = page.getViewport({ scale: 1 });
          pages.push({ n, page, width, height, ratio: width / height });
        }

        if (!cancelled) setState({ status: 'ready', percent: 100, pages, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', percent: null, pages: [], error: err });
      }
    })();

    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [url]);

  return state;
}
