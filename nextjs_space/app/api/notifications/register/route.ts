import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? (session.user as any).id as string : null;
    
    const body = await req.json();
    const { token, platform } = body ?? {};
    
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Find if this token already exists
    const existing = await prisma.pushToken.findFirst({
      where: { token }
    });

    if (existing) {
      // Update existing token with current userId (might be logging in or logging out)
      await prisma.pushToken.update({
        where: { id: existing.id },
        data: {
          userId: userId || null,
          platform: platform || existing.platform || "web",
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      // Create new token entry
      await prisma.pushToken.create({
        data: {
          token,
          userId: userId || null,
          platform: platform || "web",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error registering push token:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
