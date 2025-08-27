
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isSale, isPurchase, isSaleType, isPurchaseType, isCapitalType } from "@/components/utils/utils";

const LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
  let log: Record<string, unknown> = {};
    let fileUrl = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      // Metadata fields
      for (const [key, value] of formData.entries()) {
        if (key !== "file") {
          if ((key === "products" || key === "payment") && typeof value === "string") {
            try {
              log[key] = JSON.parse(value);
            } catch {
              log[key] = value;
            }
          } else {
            log[key] = value;
          }
        }
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
    // If type is provided in the request, use it. Otherwise, auto-detect.
    if (typeof log.type === 'string' && (log.type === 'sale' || log.type === 'purchase' || log.type === 'capital')) {
      // Use provided type
    } else {
      // Fetch company tax ID from company profile API
      let companyTaxId = '';
      try {
        const res = await fetch(`${process.env.COMPANY_PROFILE_API || 'http://localhost:3000'}/api/company-profile`);
        if (res.ok) {
          const profile = await res.json();
          if (profile && typeof profile.tax_id === 'string') {
            companyTaxId = profile.tax_id;
          }
        }
      } catch {}

      // Add type: 'sale' | 'purchase' if possible
      const isSaleResult = isSale(log, companyTaxId);
      const isPurchaseResult = isPurchase(log, companyTaxId);
      const typeValue: 'sale' | 'purchase' | undefined = isSaleResult
        ? 'sale'
        : isPurchaseResult
        ? 'purchase'
        : undefined;
      if (typeValue) {
        log.type = typeValue;
      }
    }
    log.uploadedAt = new Date().toISOString();
    if (typeof log.systemGenerated === 'undefined') {
      log.systemGenerated = false;
    }
    await fs.appendFile(LOG_FILE, JSON.stringify(log) + "\n", "utf8");
    return NextResponse.json({ success: true, fileUrl });
  } catch (err: unknown) {
    let message = 'Failed to log receipt upload';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type'); // 'sale' | 'purchase'
    const data = await fs.readFile(LOG_FILE, "utf8");
    // Each line is a JSON object
    let receipts = data
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((r): r is Record<string, unknown> => r !== null);

    // Filter by date if from/to provided
    if (from || to) {
      receipts = receipts.filter((r) => {
        if (typeof r.date !== 'string') return false;
        const d = new Date(r.date);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to)) return false;
        return true;
      });
    }
    // Sort by date ascending
    receipts.sort((a, b) => {
      if (typeof a.date !== 'string') return -1;
      if (typeof b.date !== 'string') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    let receiptsWithType = receipts;
    // Filter by type if provided
    if (type) {
      receiptsWithType = receiptsWithType.filter((r) => r.type === type);
    }
    return NextResponse.json(receiptsWithType);
  } catch (err: unknown) {
    let message = 'Failed to read logs';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
