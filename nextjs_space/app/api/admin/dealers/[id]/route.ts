import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const dealerId = params.id;
    const body = await req.json();
    const { status, gstNumber, phone, shopName, shopAddress } = body ?? {};

    const existingDealer = await prisma.user.findUnique({ where: { id: dealerId } });
    if (!existingDealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber ? String(gstNumber).trim().toUpperCase() : null;
    if (phone) updateData.phone = phone;
    if (shopName) updateData.shopName = shopName;
    if (shopAddress) updateData.shopAddress = shopAddress;

    const updated = await prisma.user.update({
      where: { id: dealerId },
      data: updateData,
    });

    if (status === "APPROVED") {
      await sendDiscordNotification({
        title: "✅ Dealer Account Approved!",
        description: `Shop: **${updated.shopName || updated.name}**\nPhone: **${updated.phone}**\nFull Dealer Admin Panel access has been unlocked.`,
        color: 3066993,
      }).catch(() => {});
    }

    return NextResponse.json({ message: "Dealer updated successfully", dealer: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update dealer" }, { status: 500 });
  }
}
