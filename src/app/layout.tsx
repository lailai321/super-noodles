import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const SITE_URL = 'https://www.supernoodlesonline.com.au'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Super Noodles | Chinese & Malaysian Restaurant Glenmore Park, Penrith',
  description: 'Order Chinese & Malaysian takeaway online in Glenmore Park, Penrith. Laksa, wonton noodle soup, honey chicken, fried rice & more — fast pickup, no delivery app fees.',
  keywords: [
    'Chinese restaurant Glenmore Park',
    'Asian restaurant Penrith',
    'Malaysian restaurant Penrith',
    'laksa Penrith',
    'wonton noodle soup Penrith',
    'honey chicken takeaway Penrith',
    'fried rice Glenmore Park',
    'char siu noodles Penrith',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: SITE_URL,
    siteName: 'Super Noodles',
    title: 'Super Noodles | Chinese & Malaysian Restaurant Glenmore Park, Penrith',
    description: 'Order Chinese & Malaysian takeaway online in Glenmore Park, Penrith. Laksa, wonton noodle soup, honey chicken, fried rice & more.',
    images: [{ url: '/banner.jpg', width: 1200, height: 630, alt: 'Super Noodles, Glenmore Park' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super Noodles | Chinese & Malaysian Restaurant Glenmore Park, Penrith',
    description: 'Order Chinese & Malaysian takeaway online in Glenmore Park, Penrith.',
    images: ['/banner.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Super Noodles',
  image: `${SITE_URL}/banner.jpg`,
  url: SITE_URL,
  telephone: '+61247334782',
  servesCuisine: ['Chinese', 'Malaysian', 'Asian'],
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kiosk 2 Glenmore Park Town Centre, 1/11 Town Terrace',
    addressLocality: 'Glenmore Park',
    addressRegion: 'NSW',
    postalCode: '2745',
    addressCountry: 'AU',
  },
  areaServed: [
    { '@type': 'Place', name: 'Glenmore Park' },
    { '@type': 'Place', name: 'Penrith' },
  ],
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '11:00',
    closes: '20:00',
  }],
  menu: SITE_URL,
  acceptsReservations: 'False',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
