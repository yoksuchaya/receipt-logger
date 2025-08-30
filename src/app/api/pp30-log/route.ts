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
