
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let log: any = {};
    let fileUrl = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      // Metadata fields
      for (const [key, value] of formData.entries()) {
        if (key !== "file") log[key] = value;
      }
      // File
      const file = formData.get("file");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = (file as File).name.split('.').pop() || 'bin';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, safeName);
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));
        fileUrl = `/uploads/${safeName}`;
        log.fileUrl = fileUrl;
        log.fileName = (file as File).name;
        log.fileType = (file as File).type;
        log.fileSize = (file as File).size;
      }
    } else {
      // Fallback: accept JSON only
      log = await req.json();
    }
    log.uploadedAt = new Date().toISOString();
    await fs.appendFile(LOG_FILE, JSON.stringify(log) + "\n", "utf8");
    return NextResponse.json({ success: true, fileUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log receipt upload" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = await fs.readFile(LOG_FILE, "utf8");
    // Each line is a JSON object
    const receipts = data
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return NextResponse.json(receipts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to read logs" }, { status: 500 });
  }
}
