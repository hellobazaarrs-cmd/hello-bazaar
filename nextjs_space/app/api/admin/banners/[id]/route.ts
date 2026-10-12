import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const bannerId = params.id;
    const body = await req.json();

    const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        ...body,
        orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) : existing.orderIndex,
        durationSeconds: body.durationSeconds !== undefined ? Number(body.durationSeconds) : (existing as any).durationSeconds || 3,
        active: body.active !== undefined ? Boolean(body.active) : existing.active,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ message: "Banner updated successfully", banner: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const bannerId = params.id;
    await prisma.banner.delete({ where: { id: bannerId } });

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete banner" }, { status: 500 });
  }
}
