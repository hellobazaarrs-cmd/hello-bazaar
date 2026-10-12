import { prisma } from "@/lib/db";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const [categories, featured, trending, brands, banners] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }).catch(() => []),
      prisma.product.findMany({ where: { featured: true, isActive: true }, take: 8, orderBy: { rating: "desc" } }).catch(() => []),
      prisma.product.findMany({ where: { trending: true, isActive: true }, take: 8, orderBy: { reviewCount: "desc" } }).catch(() => []),
      prisma.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
      prisma.banner.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }).catch(() => []),
    ]);

    return (
      <HomeClient
        categories={JSON.parse(JSON.stringify(categories || []))}
        featured={JSON.parse(JSON.stringify(featured || []))}
        trending={JSON.parse(JSON.stringify(trending || []))}
        initialBrands={JSON.parse(JSON.stringify(brands || []))}
        initialBanners={JSON.parse(JSON.stringify(banners || []))}
      />
    );
  } catch (err) {
    console.error("HomePage error:", err);
    return (
      <HomeClient
        categories={[]}
        featured={[]}
        trending={[]}
        initialBrands={[]}
        initialBanners={[]}
      />
    );
  }
}
