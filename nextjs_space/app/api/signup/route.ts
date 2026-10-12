import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";
import { sendPersonalNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      securityQuestion,
      securityAnswer,
      phone,
      role = "DEALER",
      shopName,
      shopAddress,
      gstNumber,
    } = body ?? {};

    if (!email || !password || !fullName || !securityQuestion || !securityAnswer || !phone) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    if (!shopName || !shopAddress) {
      return NextResponse.json({ error: "Shop Name and Shop Address are required for Dealer Registration" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(String(securityAnswer).toLowerCase().trim(), 10);

    const hasGst = Boolean(gstNumber && String(gstNumber).trim().length > 0);
    const status = "APPROVED";

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        phone,
        securityQuestion,
        securityAnswer: hashedAnswer,
        role: "DEALER",
        shopName,
        shopAddress,
        gstNumber: hasGst ? String(gstNumber).trim().toUpperCase() : null,
        status: "APPROVED",
      },
    });

    // Trigger Discord Notification to Admin
    sendDiscordNotification({
      title: "🏬 New Authorized Dealer Registered!",
      description: `Dealer ${shopName} registered on Hello Bazaar B2B wholesale platform and is now active.`,
      color: 3066993, // Green
      fields: [
        { name: "Shop Name", value: shopName, inline: true },
        { name: "Owner Name", value: fullName, inline: true },
        { name: "Phone Number", value: phone, inline: true },
        { name: "Email", value: normalizedEmail, inline: true },
        { name: "GST Number", value: gstNumber || "Not Provided", inline: true },
        { name: "Status", value: "APPROVED", inline: true },
      ],
    });

    // Send push notification to all Super Admins
    try {
      const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const adminUser of adminUsers) {
        await sendPersonalNotification(
          adminUser.id,
          "🏬 New Dealer Registered",
          `Shop "${shopName}" (${fullName}, ${phone}) has registered as an Authorized Dealer.`,
          undefined,
          "/admin/dealers"
        );
      }
    } catch (notifErr) {
      console.warn("Could not dispatch admin push notification:", notifErr);
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      status: "APPROVED",
      message: "Authorized Dealer account created successfully! Signing in..."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to signup" }, { status: 500 });
  }
}
