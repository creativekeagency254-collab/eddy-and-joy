import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin-dashboard'],
    },
    sitemap: 'https://www.eddjos.com/sitemap.xml',
    host: 'https://www.eddjos.com',
  };
}
