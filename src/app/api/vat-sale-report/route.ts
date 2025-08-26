import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isSale, isSaleType } from '@/components/utils/utils';
import { Receipt } from '@/types/Receipt';

// Helper to parse JSONL
async function readSalesData() {
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
    const month = searchParams.get('month'); // e.g. '06'
    const year = searchParams.get('year');   // e.g. '2025'

    if (!month || !year) {
        return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
    }

    const data = await readSalesData();
    const filtered = data.filter(
        (r: Receipt) =>
            isSaleType(r.type) &&
            typeof r.date === 'string' && r.date.startsWith(`${year}-${month}`) &&
            parseFloat(r.vat || '0') > 0.0
    );
    // Sort by date ascending
    filtered.sort((a, b) => {
        if (typeof a.date !== 'string') return -1;
        if (typeof b.date !== 'string') return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return NextResponse.json({ sales: filtered });
}
