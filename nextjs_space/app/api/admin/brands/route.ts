import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brands = await prisma.brand.findMany();
    const list = Array.isArray(brands) ? brands : [];
    list.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({ brands: list });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, logo, sortOrder, isActive } = body ?? {};

    if (!name?.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newBrand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo || "",
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ brand: newBrand });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create brand" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, logo, sortOrder, isActive } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({ brand: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update brand" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete brand" }, { status: 500 });
  }
}
