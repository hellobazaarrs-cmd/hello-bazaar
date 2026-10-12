import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { name, email, subject, message } = await req.json();
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  const ticket = await prisma.supportTicket.create({
    data: {
      name, email, subject, message,
      userId: (session?.user as any)?.id ?? null,
    },
  });

  // Trigger Discord Notification for New Support Ticket
  sendDiscordNotification({
    title: "🎫 New Support Ticket Raised!",
    description: `A new support request has been submitted by **${ticket.name}**.`,
    color: 15158332, // Orange/Red
    fields: [
      { name: "Subject", value: ticket.subject },
      { name: "Message", value: ticket.message.length > 500 ? ticket.message.substring(0, 500) + "..." : ticket.message },
      { name: "Email Address", value: ticket.email, inline: true },
      { name: "Ticket ID", value: ticket.id, inline: true },
    ],
  });

  return NextResponse.json(ticket);
}
