import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = 'https://www.autolustre.com.au';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'AutoLustre | Premium Car Detailing Sydney',
    template: '%s | AutoLustre Sydney'
  },
  description:
    'Sydney\'s premier car detailing studio. Ceramic coating, paint correction, interior detailing & PPF. IDA-certified technicians. 4.9★ across 380+ reviews. Book online.',
  keywords: [
    'car detailing Sydney',
    'car detailing near me',
    'ceramic coating Sydney',
    'paint correction Sydney',
    'car wash Sydney',
    'mobile car detailing Sydney',
    'paint protection film Sydney',
    'interior car cleaning Sydney',
    'car polishing Sydney',
    'detailing Alexandria NSW',
    'premium car detailing NSW',
    'auto detailing Sydney',
    'best car detailer Sydney',
    'swirl mark removal Sydney',
    'ceramic coating NSW',
    'car detailing Eastern Suburbs',
    'car detailing North Shore Sydney',
    'PPF Sydney',
    'vehicle detailing Sydney'
  ],
  authors: [{ name: 'AutoLustre Detailing Pty Ltd' }],
  creator: 'AutoLustre Detailing Pty Ltd',
  publisher: 'AutoLustre Detailing Pty Ltd',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  },
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-AU': '/' }
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: BASE_URL,
    siteName: 'AutoLustre',
    title: 'AutoLustre | Premium Car Detailing Sydney',
    description:
      'IDA-certified car detailing in Sydney. Ceramic coating, paint correction, PPF & interior detailing. 4.9★ rated. Book your slot online today.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLustre | Premium Car Detailing Sydney',
    description: 'Sydney\'s most trusted car detailing studio. Book online with real-time availability.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'autolustre-google-verify'
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  name: 'AutoLustre Detailing Pty Ltd',
  alternateName: 'AutoLustre',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  image: `${BASE_URL}/logo.png`,
  description:
    'Sydney\'s premier professional car detailing studio. IDA-certified technicians offering ceramic coating, paint correction, interior detailing, PPF and maintenance washes.',
  telephone: '+61412345678',
  email: 'hello@autolustre.com.au',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12-14 Industrial Circuit',
    addressLocality: 'Alexandria',
    addressRegion: 'NSW',
    postalCode: '2015',
    addressCountry: 'AU'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -33.9088,
    longitude: 151.1957
  },
  areaServed: {
    '@type': 'City',
    name: 'Sydney',
    sameAs: 'https://en.wikipedia.org/wiki/Sydney'
  },
  priceRange: '$99–$1299',
  currenciesAccepted: 'AUD',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '08:00',
      closes: '17:00'
    }
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Car Detailing Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Signature Detail' }, price: '249', priceCurrency: 'AUD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Paint Correction' }, price: '549', priceCurrency: 'AUD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior Revival' }, price: '189', priceCurrency: 'AUD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ceramic Coating' }, price: '799', priceCurrency: 'AUD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Paint Protection Film' }, price: '1299', priceCurrency: 'AUD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Maintenance Wash' }, price: '99', priceCurrency: 'AUD' }
    ]
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '380',
    bestRating: '5',
    worstRating: '1'
  },
  sameAs: [
    'https://www.instagram.com/autolustre',
    'https://www.facebook.com/autolustre',
    'https://www.google.com/maps?q=AutoLustre+Alexandria+NSW'
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
