import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.supernoodlesonline.com.au'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/checkout', '/order/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
