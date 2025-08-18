import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Types
// (Repeat the types from JournalReport for backend use)
type Receipt = {
  date: string;
  grand_total: string;
  vat: string;
  vendor: string;
  buyer_name: string;
  category: string;
  payment_type: "cash" | "transfer";
  notes: string;
  [key: string]: any;
};

type Account = {
  accountNumber: string;
  accountName: string;
  note: string;
};

type JournalEntry = {
  date: string;
  description: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
};

const RECEIPT_LOG_FILE = path.join(process.cwd(), "receipt-uploads.jsonl");
const ACCOUNT_CHART_FILE = path.join(process.cwd(), "account-chart.json");

function generateJournalEntries(receipts: Receipt[], accounts: Account[]): JournalEntry[] {
  const getAccount = (number: string) =>
    accounts.find((a) => a.accountNumber === number) || { accountNumber: number, accountName: "Unknown", note: "" };

  const entries: JournalEntry[] = [];

  receipts.forEach((receipt) => {
    const isPurchase = receipt.category.startsWith("ซื้อ");
    const isSale = receipt.category.startsWith("ขาย");
    const grandTotal = parseFloat(receipt.grand_total);
    const vat = parseFloat(receipt.vat);
    const net = grandTotal - vat;
    const description = receipt.notes;

    if (isPurchase) {
      // Debit สต๊อกทอง (1100) with (grand_total - vat)
      const stock = getAccount("1100");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: stock.accountNumber,
        accountName: stock.accountName,
        debit: net,
        credit: 0,
      });
      // Debit VAT Input (2210) with vat
      const vatInput = getAccount("2210");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: vatInput.accountNumber,
        accountName: vatInput.accountName,
        debit: vat,
        credit: 0,
      });
      // Credit เงินสดในร้าน (1000) or เงินฝากธนาคาร (1010)
      const paymentAcc = getAccount(receipt.payment_type === "cash" ? "1000" : "1010");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: paymentAcc.accountNumber,
        accountName: paymentAcc.accountName,
        debit: 0,
        credit: grandTotal,
      });
    } else if (isSale) {
      // Debit เงินสดในร้าน (1000) or เงินฝากธนาคาร (1010) with grand_total
      const paymentAcc = getAccount(receipt.payment_type === "cash" ? "1000" : "1010");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: paymentAcc.accountNumber,
        accountName: paymentAcc.accountName,
        debit: grandTotal,
        credit: 0,
      });
      // Credit ขายทอง/สินค้า (4000) with (grand_total - vat)
      const sales = getAccount("4000");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: sales.accountNumber,
        accountName: sales.accountName,
        debit: 0,
        credit: net,
      });
      // Credit VAT Output (2200) with vat
      const vatOutput = getAccount("2200");
      entries.push({
        date: receipt.date,
        description,
        accountNumber: vatOutput.accountNumber,
        accountName: vatOutput.accountName,
        debit: 0,
        credit: vat,
      });
    }
  });

  return entries;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // 1-12
    const year = searchParams.get('year'); // 4-digit year

    // Read receipts
    const data = await fs.readFile(RECEIPT_LOG_FILE, "utf8");
    let receipts: Receipt[] = data
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((r): r is Receipt => r !== null);

    // Filter by month/year if provided
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      receipts = receipts.filter((r) => {
        if (typeof r.date !== 'string') return false;
        const d = new Date(r.date);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      });
    }

    // Read accounts
    const accountsData = await fs.readFile(ACCOUNT_CHART_FILE, "utf8");
    const accounts: Account[] = JSON.parse(accountsData);

    // Generate journal entries
    const journalEntries = generateJournalEntries(receipts, accounts);
    // Sort by date ascending
    journalEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(journalEntries);
  } catch (err: unknown) {
    let message = 'Failed to generate journal report';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
