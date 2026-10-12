import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET reviews and check if the user is allowed to review
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Find product
    const product = await prisma.product.findUnique({ where: { slug: params.slug } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });

    let canReview = false;
    let hasReviewed = false;

    if (userId) {
      // Check if user has already reviewed this product
      const existing = await prisma.review.findFirst({
        where: { productId: product.id, userId },
      });
      hasReviewed = !!existing;

      // Check if user has booked this product successfully
      const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: true },
      });

      canReview = orders.some(
        (o: any) =>
          o.status !== "CANCELLED" &&
          o.status !== "PENDING_PAYMENT" &&
          o.items.some((item: any) => item.productId === product.id)
      );
    }

    return NextResponse.json({
      reviews,
      canReview: canReview && !hasReviewed,
      hasReviewed,
    });
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST create a review and update product average rating
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;

    const { rating, comment } = await req.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating. Must be between 1 and 5" }, { status: 400 });
    }

    // Find product
    const product = await prisma.product.findUnique({ where: { slug: params.slug } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Check if user has already reviewed
    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Check if user has booked this product successfully
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
    });

    const hasBooked = orders.some(
      (o: any) =>
        o.status !== "CANCELLED" &&
        o.status !== "PENDING_PAYMENT" &&
        o.items.some((item: any) => item.productId === product.id)
    );

    if (!hasBooked) {
      return NextResponse.json({ error: "You can only review products you have successfully purchased" }, { status: 403 });
    }

    // Save the review
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        rating: Number(rating),
        comment: comment || "",
      },
    });

    // Update product rating and count (strictly actual reviews, no demo blending)
    const dbReviews = await prisma.review.findMany({ where: { productId: product.id } });
    const actualCount = dbReviews.length;
    const actualSum = dbReviews.reduce((sum: number, r: any) => sum + r.rating, 0);

    const finalRating = actualCount > 0 ? actualSum / actualCount : 0;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number(finalRating.toFixed(1)),
        reviewCount: actualCount,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error("Error creating review:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

function formatToDDMMYYYY(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {}
  return dateStr;
}
