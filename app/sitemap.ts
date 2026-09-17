import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.autolustre.com.au';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/booking`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 }
  ];

  const serviceSlugs = [
    'signature-detail',
    'paint-correction',
    'interior-revival',
    'ceramic-protection',
    'exterior-detailing',
    'interior-detailing',
    'paint-protection',
    'ceramic-coating',
    'maintenance-wash'
  ];

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${base}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85
  }));

  return [...staticPages, ...servicePages];
}
