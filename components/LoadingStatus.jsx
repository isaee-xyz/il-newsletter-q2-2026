'use client';

import { PDF_URL } from '@/lib/config';

const COPY = {
  loading: {
    title: 'Loading the newsletter…',
    body: (percent) => (percent ? `Fetching the PDF… ${percent}%` : 'Fetching the PDF.'),
  },
  error: {
    title: 'Inline preview unavailable',
    body: () => 'The PDF could not be loaded here. Use the button below to open it directly.',
  },
  unsupported: {
    title: 'Inline preview unavailable',
    body: () => 'This browser could not load the inline viewer. Use the button below to open the PDF.',
  },
};

/** Whatever happens, there is always a way through to the actual document. */
export default function LoadingStatus({ status, percent }) {
  const copy = COPY[status] ?? COPY.error;

  return (
    <div className="status">
      {status === 'loading' && <div className="spinner" aria-hidden="true" />}
      <h2>{copy.title}</h2>
      <p>{copy.body(percent)}</p>
      <a className="btn" href={PDF_URL} target="_blank" rel="noopener noreferrer">
        Open PDF directly
      </a>
    </div>
  );
}
