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

export async function PATCH(req: NextRequest) {
  try {
    const patch = await req.json();
    // Read current file
    const data = await fs.readFile(ACCOUNT_CHART_FILE, "utf8");
    const chart = JSON.parse(data);

    // Update accounts
    if (Array.isArray(patch.accounts)) {
      chart.accounts = patch.accounts;
    }
    // Update rules
    if (patch.rules) {
      chart.rules = patch.rules;
    }
    // Update typeLabels
    if (patch.typeLabels) {
      chart.typeLabels = patch.typeLabels;
    }
    // Write back
    await fs.writeFile(ACCOUNT_CHART_FILE, JSON.stringify(chart, null, 2), "utf8");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    let message = 'Failed to patch account chart';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
