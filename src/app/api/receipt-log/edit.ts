import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");

export async function PUT(req: NextRequest) {
  try {
    const { uploadedAt, ...update } = await req.json();
    if (!uploadedAt) return NextResponse.json({ error: "Missing uploadedAt" }, { status: 400 });
    const data = await fs.readFile(LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean);
    const updated = lines.map(line => {
      try {
        const obj = JSON.parse(line);
        if (obj.uploadedAt === uploadedAt) {
          return JSON.stringify({ ...obj, ...update });
        }
        return line;
      } catch {
        return line;
      }
    });
    await fs.writeFile(LOG_FILE, updated.join("\n") + "\n", "utf8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update receipt" }, { status: 500 });
  }
}
