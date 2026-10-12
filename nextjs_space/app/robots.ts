import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const headersList = headers();
  const host = headersList.get('host') || 'HelloBazaars.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/profile', '/orders', '/forgot-password', '/login', '/register'],
    },
    sitemap: `https://${host}/sitemap.xml`,
  };
}

