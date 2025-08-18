import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");

export async function DELETE(req: NextRequest) {
  try {
    const { receipt_no } = await req.json();
    if (!receipt_no) return NextResponse.json({ error: "Missing receipt_no" }, { status: 400 });
    const data = await fs.readFile(LOG_FILE, "utf8");
    const lines = data.split("\n").filter(Boolean);
    let found = false;
    console.log(`Attempting to delete receipt_no: '${receipt_no}'`);
    const filtered = lines.filter(line => {
      try {
        const obj = JSON.parse(line);
        const objReceiptNo = String(obj.receipt_no).trim();
        const reqReceiptNo = String(receipt_no).trim();
        console.log(`Comparing file receipt_no: '${objReceiptNo}' with request: '${reqReceiptNo}'`);
        if (objReceiptNo === reqReceiptNo) {
          found = true;
          console.log(`Match found. Deleting receipt_no: '${objReceiptNo}'`);
          return false;
        }
        return true;
      } catch (e) {
        console.warn('Failed to parse line as JSON:', line, e);
        return true;
      }
    });
    if (!found) {
      console.warn(`No receipt found for receipt_no: '${receipt_no}'`);
    }
    await fs.writeFile(LOG_FILE, filtered.join("\n") + "\n", "utf8");
    return NextResponse.json({ success: true, found });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete receipt" }, { status: 500 });
  }
}
