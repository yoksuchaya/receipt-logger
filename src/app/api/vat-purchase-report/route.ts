import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function readPurchaseData() {
    const filePath = path.join(process.cwd(), 'receipt-uploads.jsonl');
    const content = await fs.readFile(filePath, 'utf8');
    return content
        .split('\n')
        .filter(Boolean)
        .map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
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
        (r: Record<string, unknown>) =>
            typeof r.vendor_tax_id === 'string' && r.vendor_tax_id !== '0735559006568' &&
            r.buyer_tax_id === '0735559006568' &&
            typeof r.date === 'string' && r.date.startsWith(`${year}-${month}`)
    );
    // Sort by date ascending
    filtered.sort((a, b) => {
        if (typeof a.date !== 'string') return -1;
        if (typeof b.date !== 'string') return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return NextResponse.json({ purchases: filtered });
}
