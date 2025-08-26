import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isPurchaseType } from '@/components/utils/utils';
import type { Receipt } from "@/types/Receipt";

async function readPurchaseData(): Promise<Receipt[]> {
    const filePath = path.join(process.cwd(), 'receipt-uploads.jsonl');
    const content = await fs.readFile(filePath, 'utf8');
    return content
        .split('\n')
        .filter(Boolean)
        .map(line => {
            try {
                return JSON.parse(line) as Receipt;
            } catch {
                return null;
            }
        })
        .filter((r): r is Receipt => r !== null);
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
        return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
    }

    const data = await readPurchaseData();
    // Filter for purchase: main company is the buyer, vendor is not the main company
    const filtered = data.filter(
        (r: Receipt) =>
            typeof r.type === 'string' &&
            isPurchaseType(r.type) &&
            typeof r.date === 'string' && r.date.startsWith(`${year}-${month}`) &&
            parseFloat(r.vat || '0') > 0.0
    );
    // Sort by date ascending
    filtered.sort((a, b) => {
        if (typeof a.date !== 'string') return -1;
        if (typeof b.date !== 'string') return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return NextResponse.json({ purchases: filtered });
}
