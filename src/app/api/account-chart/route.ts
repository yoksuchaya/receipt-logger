import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ACCOUNT_CHART_FILE = path.join(process.cwd(), "account-chart.json");

export async function GET(req: NextRequest) {
  try {
  const data = await fs.readFile(ACCOUNT_CHART_FILE, "utf8");
  const chart = JSON.parse(data);
  return NextResponse.json(chart);
  } catch (err: unknown) {
    let message = 'Failed to read account chart';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
