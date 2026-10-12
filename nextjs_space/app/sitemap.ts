import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = headers();
  const host = headersList.get('host') || 'HelloBazaars.com';
  const baseUrl = `https://${host}`;

  try {
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true }
    });

    // Get all categories
    const categories = await prisma.category.findMany();

    const productEntries = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const categoryEntries = categories.map((c) => ({
      url: `${baseUrl}/products?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Static pages
    const staticPages = [
      '',
      '/home',
      '/offers',
      '/support',
      '/terms',
      '/refunds',
      '/returns',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' || route === '/home' ? 1.0 : 0.5,
    }));

    return [...staticPages, ...categoryEntries, ...productEntries];
  } catch (e) {
    console.error('Error generating sitemap:', e);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      }
    ];
  }
}

