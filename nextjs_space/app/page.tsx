import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";

export default async function RootPage() {
  try {
    const session = await getServerSession(authOptions);
    if (session) {
      const role = (session.user as any)?.role;
      if (role === "ADMIN") redirect("/admin");
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT") || e?.message === "NEXT_REDIRECT") {
      throw e;
    }
    console.error("RootPage session error:", e);
  }
  redirect("/home");
}
