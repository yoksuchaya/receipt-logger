import { formatMoney } from "@/components/utils/utils";

// PUT: Update an existing PP30 log by month/year
export async function PUT(req: Request) {
  const body = await req.json();
  const { month, year } = body;
  if (!month || !year) {
    return NextResponse.json({ error: 'month and year required' }, { status: 400 });
  }
  try {
    // Read all logs
    let logs: any[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      logs = data.trim().split('\n').map(line => JSON.parse(line));
    } catch {
      // If file does not exist, treat as empty
      logs = [];
    }
    // Find index of log to update
    const idx = logs.findIndex(l => l.month === month && l.year === year);
    if (idx === -1) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    // Update log
    logs[idx] = { ...logs[idx], ...body };
    // Write all logs back
    await fs.writeFile(filePath, logs.map(l => JSON.stringify(l)).join('\n') + '\n', 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}
// PP30 log API route (stub)
// This will store and retrieve pp30 form logs by month/year
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'pp30-logs.jsonl');

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const logs = data.trim().split('\n').map(line => JSON.parse(line));
    if (month && year) {
      const log = logs.find(l => l.month === month && l.year === year);
      return NextResponse.json(log || null);
    }
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  await fs.appendFile(filePath, JSON.stringify(body) + '\n', 'utf-8');
  return NextResponse.json({ success: true });
}
