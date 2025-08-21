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
  vendor_tax_id?: string;
  buyer_tax_id?: string;
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

    // Fetch COGS from stock-movement API for the current month
    // We'll use the same month/year as the filter
    // Fetch stock-movement rows for the month for COGS calculation
    let stockMovements: any[] = [];
    if (month && year) {
      const stockMovementUrl = `${req.nextUrl.origin}/api/stock-movement?month=${month}&year=${year}`;
      const res = await fetch(stockMovementUrl);
      if (res.ok) {
        stockMovements = await res.json();
      }
    }

    // Generate journal entries (async, inlined here)
    const entries: JournalEntry[] = [];
    for (const receipt of receipts) {
      const sale = receipt.type === 'sale';
      const purchase = receipt.type === 'purchase';
      const capital = receipt.type === 'capital';
      const grandTotal = parseFloat(receipt.grand_total);
      const vat = parseFloat(receipt.vat);
      const net = grandTotal - vat;
      const description = receipt.notes;
      if (purchase) {
        // Debit สต๊อกทอง (1100) with (grand_total - vat)
        const stock = accounts.find((a) => a.accountNumber === "1100") || { accountNumber: "1100", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: stock.accountNumber,
          accountName: stock.accountName,
          debit: net,
          credit: 0,
        });
        // Debit VAT Input (2210) with vat
        const vatInput = accounts.find((a) => a.accountNumber === "2210") || { accountNumber: "2210", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: vatInput.accountNumber,
          accountName: vatInput.accountName,
          debit: vat,
          credit: 0,
        });
        // Credit เงินสดในร้าน (1000) or เงินฝากธนาคาร (1010)
        const paymentAcc = accounts.find((a) => a.accountNumber === (receipt.payment_type === "cash" ? "1000" : "1010")) || { accountNumber: receipt.payment_type === "cash" ? "1000" : "1010", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: paymentAcc.accountNumber,
          accountName: paymentAcc.accountName,
          debit: 0,
          credit: grandTotal,
        });
  } else if (sale) {
        // Debit เงินสดในร้าน (1000) or เงินฝากธนาคาร (1010) with grand_total
        const paymentAcc = accounts.find((a) => a.accountNumber === (receipt.payment_type === "cash" ? "1000" : "1010")) || { accountNumber: receipt.payment_type === "cash" ? "1000" : "1010", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: paymentAcc.accountNumber,
          accountName: paymentAcc.accountName,
          debit: grandTotal,
          credit: 0,
        });
        // Credit ขายทอง/สินค้า (4000) with (grand_total - vat)
        const sales = accounts.find((a) => a.accountNumber === "4000") || { accountNumber: "4000", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: sales.accountNumber,
          accountName: sales.accountName,
          debit: 0,
          credit: net,
        });
        // Credit VAT Output (2200) with vat
        const vatOutput = accounts.find((a) => a.accountNumber === "2200") || { accountNumber: "2200", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: vatOutput.accountNumber,
          accountName: vatOutput.accountName,
          debit: 0,
          credit: vat,
        });
        // Use weighted average COGS: for each 'out' movement for this receipt_no, use qty * balanceAvgCost
        let cost = 0;
        if (receipt.receipt_no && stockMovements.length > 0) {
          // Find all 'out' movements for this receipt_no
          const outs = stockMovements.filter((m: any) => m.type === 'sale' && m.desc && m.desc.includes('เอกสารเลขที่'))
            .filter((m: any) => {
              const match = m.desc.match(/เอกสารเลขที่\s*(\S+)/);
              return match && match[1] === receipt.receipt_no;
            });
          // For each, use qty * balanceAvgCost (both as numbers)
          cost = outs.reduce((sum: number, m: any) => {
            const qty = parseFloat(m.qty);
            const avgCost = parseFloat(m.balanceAvgCost);
            if (!isNaN(qty) && !isNaN(avgCost)) {
              return sum + qty * avgCost;
            }
            return sum;
          }, 0);
        }
        if (cost && !isNaN(cost) && cost > 0) {
          // Debit COGS (5000)
          const cogs = accounts.find((a) => a.accountNumber === "5000") || { accountNumber: "5000", accountName: "Unknown", note: "" };
          entries.push({
            date: receipt.date,
            description: "ต้นทุนทองที่ขาย",
            accountNumber: cogs.accountNumber,
            accountName: cogs.accountName,
            debit: cost,
            credit: 0,
          });
          // Credit Inventory (1100)
          const stock = accounts.find((a) => a.accountNumber === "1100") || { accountNumber: "1100", accountName: "Unknown", note: "" };
          entries.push({
            date: receipt.date,
            description: "ต้นทุนทองที่ขาย",
            accountNumber: stock.accountNumber,
            accountName: stock.accountName,
            debit: 0,
            credit: cost,
          });
        }
      } else if (capital) {
        // Capital injection: Debit เงินฝากธนาคาร (1010), Credit เงินลงทุนผู้ถือหุ้น (3000)
        const bank = accounts.find((a) => a.accountNumber === "1010") || { accountNumber: "1010", accountName: "Unknown", note: "" };
        const equity = accounts.find((a) => a.accountNumber === "3000") || { accountNumber: "3000", accountName: "Unknown", note: "" };
        entries.push({
          date: receipt.date,
          description,
          accountNumber: bank.accountNumber,
          accountName: bank.accountName,
          debit: grandTotal,
          credit: 0,
        });
        entries.push({
          date: receipt.date,
          description,
          accountNumber: equity.accountNumber,
          accountName: equity.accountName,
          debit: 0,
          credit: grandTotal,
        });
      }
    }
    // Sort by date ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return NextResponse.json(entries);
  } catch (err: unknown) {
    let message = 'Failed to generate journal report';
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
      message = (err as { message?: string }).message as string;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
