import Reader from '@/components/Reader';
import { DESCRIPTION, TITLE } from '@/lib/config';

// Server component. The heading and paragraph are the only prerendered text on
// the page — the reader itself is canvas, which crawlers cannot read — so they
// carry the page's meaning for search and screen readers.
export default function Home() {
  return (
    <main>
      <h1 className="sr">{TITLE}</h1>
      <p className="sr">{DESCRIPTION}</p>
      <Reader />
    </main>
  );
}
