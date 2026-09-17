import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = 'https://www.autolustre.com.au';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/portal/', '/api/', '/login', '/rep-login']
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
