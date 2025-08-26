import type { StockMovement } from "@/types/StockMovement";
import { isSaleType, isPurchaseType, isCapitalType } from "@/components/utils/utils";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Receipt } from "@/types/Receipt";


type Account = {
  accountNumber: string;
  accountName: string;
  note: string;
  type?: string;
};

type JournalEntry = {
  date: string;
  description: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // 1-12
    const year = searchParams.get('year'); // 4-digit year


    // Fetch receipts from API
    let receipts: Receipt[] = [];
    const params = new URLSearchParams();
    if (month && year) {
      // Compose a date range for the month
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const from = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const to = new Date(y, m, 0).toISOString().slice(0, 10);
      params.append('from', from);
      params.append('to', to);
    }
    const receiptsRes = await fetch(`${req.nextUrl.origin}/api/receipt-log?${params.toString()}`);
    if (!receiptsRes.ok) throw new Error('Failed to fetch receipts');
    receipts = await receiptsRes.json();

    // Fetch accounts and rules from API (no file fallback)
    const accountChartRes = await fetch(`${req.nextUrl.origin}/api/account-chart`);
    if (!accountChartRes.ok) throw new Error('Failed to fetch account chart');
    const accountChart = await accountChartRes.json();
    const accounts: Account[] = Array.isArray(accountChart) ? accountChart : accountChart.accounts;
    const rules: any = Array.isArray(accountChart) ? {} : accountChart.rules;

    // Fetch COGS from stock-movement API for the current month
    // We'll use the same month/year as the filter
    // Fetch stock-movement rows for the month for COGS calculation
    let stockMovements: StockMovement[] = [];
    if (month && year) {
      const stockMovementUrl = `${req.nextUrl.origin}/api/stock-movement?month=${month}&year=${year}`;
      const res = await fetch(stockMovementUrl);
      if (res.ok) {
        stockMovements = await res.json();
      }
    }

    const entries: JournalEntry[] = [];
    for (const receipt of receipts) {
      let ruleType: string | null = null;
      if (isPurchaseType(receipt.type)) ruleType = "purchase";
      else if (isSaleType(receipt.type)) ruleType = "sale";
      else if (isCapitalType(receipt.type)) ruleType = "capital";
      if (!ruleType || !rules[ruleType]) continue;

      const grandTotal = parseFloat(receipt.grand_total);
      const vat = parseFloat(receipt.vat);
      const net = grandTotal - vat;
      const description = receipt.notes;

      // Calculate cost for sale (COGS)
      let cost = 0;
      if (ruleType === "sale") {
        if (receipt.receipt_no && stockMovements.length > 0) {
          const outs = stockMovements.filter((m) => isSaleType(m.type) && m.desc && m.desc.includes('เอกสารเลขที่'))
            .filter((m) => {
              const match = m.desc?.match(/เอกสารเลขที่\s*(\S+)/);
              return match && match[1] === receipt.receipt_no;
            });
          cost = outs.reduce((sum, m) => {
            const qty = parseFloat(m.qty ?? '0');
            const avgCost = parseFloat(m.balanceAvgCost ?? '0');
            if (!isNaN(qty) && !isNaN(avgCost)) {
              return sum + qty * avgCost;
            }
            return sum;
          }, 0);
        }
      }

      for (const rule of rules[ruleType]) {
        // Determine account number (handle payment type for cash/bank using paymentTypeMap)
        let accountNumber = rule.debit || rule.credit || "";
        if (accountNumber.includes("|")) {
          const paymentTypeMap = rules.paymentTypeMap || {};
          const mapped = paymentTypeMap[receipt.payment_type];
          if (mapped && accountNumber.split("|").includes(mapped)) {
            accountNumber = mapped;
          } else {
            accountNumber = accountNumber.split("|")[0];
          }
        }
        const acc = accounts.find((a) => a.accountNumber === accountNumber) || { accountNumber, accountName: "Unknown", note: "" };

        // Determine amount
        let amount = 0;
        if (rule.amount === "grandTotal") amount = grandTotal;
        else if (rule.amount === "vat") amount = vat;
        else if (rule.amount === "net") amount = net;
        else if (rule.amount === "cost") amount = cost;
        else if (!isNaN(Number(rule.amount))) amount = Number(rule.amount);


        // Only add entry if amount > 0 and not NaN
        if (amount && amount > 0 && !isNaN(amount)) {
          entries.push({
            date: receipt.date,
            description: rule.description || description,
            accountNumber: acc.accountNumber,
            accountName: acc.accountName,
            debit: rule.debit ? amount : 0,
            credit: rule.credit ? amount : 0,
          });
        }
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
