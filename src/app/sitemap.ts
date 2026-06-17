import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.supernoodlesonline.com.au'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/catering`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
