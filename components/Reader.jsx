'use client';

import Deck from '@/components/Deck';
import LoadingStatus from '@/components/LoadingStatus';
import usePdfDocument from '@/hooks/usePdfDocument';
import { PDF_URL } from '@/lib/config';

export default function Reader() {
  const { status, percent, pages } = usePdfDocument(PDF_URL);

  if (status !== 'ready') {
    return (
      <div className="viewer">
        <LoadingStatus status={status} percent={percent} />
      </div>
    );
  }

  return <Deck pages={pages} />;
}
