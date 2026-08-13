import './globals.css';
import { DESCRIPTION, OG_IMAGE, SITE_URL, TITLE } from '@/lib/config';

// metadataBase makes the relative OG paths below resolve to absolute URLs.
// Link previews are fetched by crawlers that do not run JS, so these must be
// absolute — change SITE_URL in lib/config.js if a custom domain is attached.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'article',
    siteName: 'Infinity Learn',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    locale: 'en_IN',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Quarter at a Glance — IL Newsletter, May to July 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230f2c52'/%3E%3Cpath d='M8 10h7l6 6-6 6H8l6-6z' fill='%232e86c8'/%3E%3C/svg%3E",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f2c52',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
