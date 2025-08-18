import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");

export async function PUT(req: NextRequest) {
  try {
    const { receipt_no, ...update } = await req.json();
    if (!receipt_no) return NextResponse.json({ error: "Missing receipt_no" }, { status: 400 });
    const data = await fs.readFile(LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean);
    let found = false;
    const updated = lines.map(line => {
      try {
        const obj = JSON.parse(line);
        if (String(obj.receipt_no).trim() === String(receipt_no).trim()) {
          found = true;
          return JSON.stringify({ ...obj, ...update });
        }
        return line;
      } catch {
        return line;
      }
    });
    if (!found) {
      console.warn(`No receipt found for receipt_no: '${receipt_no}'`);
    }
    await fs.writeFile(LOG_FILE, updated.join("\n") + "\n", "utf8");
    return NextResponse.json({ success: true, found });
  } catch (err: unknown) {
    let message = 'Failed to update receipt';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
