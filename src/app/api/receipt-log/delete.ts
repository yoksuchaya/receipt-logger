import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");

export async function DELETE(req: NextRequest) {
  try {
    const { uploadedAt } = await req.json();
    if (!uploadedAt) return NextResponse.json({ error: "Missing uploadedAt" }, { status: 400 });
    const data = await fs.readFile(LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean);
    const filtered = lines.filter(line => {
      try {
        const obj = JSON.parse(line);
        return obj.uploadedAt !== uploadedAt;
      } catch {
        return true;
      }
    });
    await fs.writeFile(LOG_FILE, filtered.join("\n") + "\n", "utf8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete receipt" }, { status: 500 });
  }
}
