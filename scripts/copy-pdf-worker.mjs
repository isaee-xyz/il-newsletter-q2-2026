// The PDF.js worker has to be fetched as a URL at runtime, so it cannot be
// bundled — it is copied into public/ and pinned to the installed pdfjs-dist
// version. A library/worker version mismatch throws at load, so this runs on
// every install rather than being committed by hand.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs');
const dest = join(process.cwd(), 'public', 'pdf.worker.min.mjs');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[pdf worker] ${src} -> ${dest}`);
