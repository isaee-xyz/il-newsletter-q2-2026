/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Replaces the header rules the static build kept in vercel.json.
  async headers() {
    return [
      {
        // Content-Disposition: inline so the fallback link opens the PDF
        // rather than downloading it. Immutable: the file only changes when a
        // new issue ships, which ships under a new filename.
        source: '/:file*.pdf',
        headers: [
          { key: 'Content-Type', value: 'application/pdf' },
          { key: 'Content-Disposition', value: 'inline' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Pinned to the installed pdfjs-dist version by the postinstall copy,
        // so it is safe to cache hard.
        source: '/pdf.worker.min.mjs',
        headers: [
          { key: 'Content-Type', value: 'text/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/og-image.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
};

export default nextConfig;
