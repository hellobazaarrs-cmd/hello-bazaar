import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Cloudinary credentials — Hello Bazaar Cloudinary
const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || "pkit8qt5";
const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY || "549212815238324";
const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || "O3j_j1NzRy_mOds4iArNUyuH2rk";

async function uploadToCloudinary(
  fileBytes: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isVideo =
    mimeType.startsWith("video/") ||
    fileName.toLowerCase().endsWith(".mp4") ||
    fileName.toLowerCase().endsWith(".webm") ||
    fileName.toLowerCase().endsWith(".mov") ||
    fileName.toLowerCase().endsWith(".avi") ||
    fileName.toLowerCase().endsWith(".mkv");

  const base64Data = Buffer.from(new Uint8Array(fileBytes)).toString("base64");
  const fileDataUri = `data:${mimeType || "application/octet-stream"};base64,${base64Data}`;

  // Cloudinary resource types: 'video' for MP4/WebM, 'raw' for PDFs, 'auto' or 'image' for images
  const resourceType = isPdf ? "raw" : isVideo ? "video" : "image";

  const form = new FormData();
  form.append("file", fileDataUri);
  form.append("api_key", CLOUDINARY_API_KEY);

  const timestamp = Math.floor(Date.now() / 1000);
  form.append("timestamp", String(timestamp));

  let publicId = "";
  if (isPdf) {
    publicId = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    if (!publicId.toLowerCase().endsWith(".pdf")) {
      publicId += ".pdf";
    }
    form.append("public_id", publicId);
  }

  // Cloudinary signed authentication
  let signatureStr = "";
  if (isPdf && publicId) {
    signatureStr = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  } else {
    signatureStr = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  }

  const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");
  form.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Cloudinary Upload Response Error:", errText);
    throw new Error(`Cloudinary upload failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.secure_url || data.url;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "ADMIN" && currentUser?.role !== "DEALER")) {
      return NextResponse.json({ error: "Unauthorized upload access" }, { status: 401 });
    }

    const formData = await req.formData();
    let files: File[] = [];

    // Extract files from formData regardless of key name ('file', 'files', 'image', 'media', etc.)
    const rawFiles = formData.getAll("files");
    const rawSingleFile = formData.get("file") || formData.get("image") || formData.get("media") || formData.get("video");

    if (Array.isArray(rawFiles) && rawFiles.length > 0) {
      files = rawFiles.filter((f) => f && typeof f === "object" && "name" in f && (f as File).name) as File[];
    }

    if (files.length === 0 && rawSingleFile && typeof rawSingleFile === "object" && "name" in rawSingleFile && (rawSingleFile as File).name) {
      files = [rawSingleFile as File];
    }

    // Fallback: iterate over all formData entries to find any File object
    if (files.length === 0) {
      for (const [key, value] of Array.from(formData.entries())) {
        if (value && typeof value === "object" && "name" in value && (value as File).name) {
          files.push(value as File);
        }
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file received in request" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!file || !file.name) continue;

      const bytes = await file.arrayBuffer();
      const mimeType = file.type || (file.name.endsWith(".mp4") ? "video/mp4" : "image/jpeg");

      try {
        const url = await uploadToCloudinary(bytes, file.name, mimeType);
        urls.push(url);
        console.log("☁️ File uploaded successfully:", url);
      } catch (cloudErr: any) {
        console.error("Cloudinary upload error:", cloudErr.message || cloudErr);
        throw cloudErr;
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "Failed to upload file content" }, { status: 500 });
    }

    return NextResponse.json({
      url: urls[0],
      urls,
      message: "File uploaded successfully!",
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
