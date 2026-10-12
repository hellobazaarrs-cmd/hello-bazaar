import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-check";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const cwd = process.cwd();
    const filePath = path.resolve(cwd, "firebase-mock.json");
    const exists = fs.existsSync(filePath);

    let size = 0;
    let readError = null;
    let filePreview = "";

    if (exists) {
      try {
        const stats = fs.statSync(filePath);
        size = stats.size;
        const content = fs.readFileSync(filePath, "utf8");
        filePreview = content.substring(0, 500) + "...";
      } catch (err: any) {
        readError = err.message || err;
      }
    }

    // Test write permission
    let writeTestSuccess = false;
    let writeTestError = null;
    const testPath = path.resolve(cwd, "firebase-mock-write-test.txt");
    try {
      fs.writeFileSync(testPath, "test-" + Date.now(), "utf8");
      fs.unlinkSync(testPath);
      writeTestSuccess = true;
    } catch (err: any) {
      writeTestError = err.message || err;
    }

    return NextResponse.json({
      cwd,
      filePath,
      exists,
      size,
      readError,
      writeTestSuccess,
      writeTestError,
      filePreview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
