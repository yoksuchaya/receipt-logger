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
      // Compose a date range for the month using string formatting (no timezone issues)
      const y = String(year).padStart(4, '0');
      const m = String(month).padStart(2, '0');
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      const from = `${y}-${m}-01`;
      const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      params.append('from', from);
      params.append('to', to);
    }
    const receiptsRes = await fetch(`${req.nextUrl.origin}/api/receipt-log?${params.toString()}`);
    if (!receiptsRes.ok) throw new Error('Failed to fetch receipts');
    receipts = await receiptsRes.json();
    // Robust string-based month filter (like ledger API)
    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      const yearStr = String(year).padStart(4, '0');
      receipts = receipts.filter(r => {
        if (!r.date || typeof r.date !== 'string') return false;
        return r.date.slice(0, 7) === `${yearStr}-${monthStr}`;
      });
    }

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
      // Collect payment types and amounts for splitting grandTotal
      let paymentEntries: { type: string; amount: number }[] = [];
      if (receipt.payment) {
        if (receipt.payment.cash && !isNaN(Number(receipt.payment.cash)) && Number(receipt.payment.cash) > 0) {
          paymentEntries.push({ type: "cash", amount: Number(receipt.payment.cash) });
        }
        if (receipt.payment.transfer && !isNaN(Number(receipt.payment.transfer)) && Number(receipt.payment.transfer) > 0) {
          paymentEntries.push({ type: "transfer", amount: Number(receipt.payment.transfer) });
        }
        if (receipt.payment.credit_card && !isNaN(Number(receipt.payment.credit_card)) && Number(receipt.payment.credit_card) > 0) {
          paymentEntries.push({ type: "credit_card", amount: Number(receipt.payment.credit_card) });
        }
      }
      // Fallback: if no split, use payment_type or default to grandTotal
      if (paymentEntries.length === 0) {
        let paymentType = receipt.payment_type;
        if (!paymentType && receipt.payment) {
          if (receipt.payment.transfer && receipt.payment.transfer !== "") paymentType = "transfer";
          else if (receipt.payment.cash && receipt.payment.cash !== "") paymentType = "cash";
          else if (receipt.payment.credit_card && receipt.payment.credit_card !== "") paymentType = "cash";
        }
        paymentEntries.push({ type: paymentType || "cash", amount: parseFloat(receipt.grand_total) });
      }
      let ruleType: string | null = null;
      // Use only journalTypeLabels from account chart for ruleType detection
      if (accountChart && accountChart.journalTypeLabels && typeof receipt.type === 'string') {
        if (Object.keys(accountChart.journalTypeLabels).includes(receipt.type)) {
          ruleType = receipt.type;
        }
      }
      if (!ruleType || !rules[ruleType]) continue;

      const grandTotal = parseFloat(receipt.grand_total);
      const vat = parseFloat(receipt.vat) || 0;
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

      // Support custom VAT closing fields
      // Try to get from receipt.entries if present (systemGenerated receipts)
      let vatOutput = 0, vatInput = 0, vatPayable = 0, vatCredit = 0;
      if ((ruleType === "vat_closing_payable" || ruleType === "vat_closing_credit") && Array.isArray(receipt.entries)) {
        for (const e of receipt.entries) {
          if (e.account && typeof e.account === 'string') {
            if (e.account.startsWith('2200')) vatOutput = e.debit || e.credit || 0;
            if (e.account.startsWith('1200')) vatInput = e.debit || e.credit || 0;
            if (e.account.startsWith('2190')) vatPayable = e.debit || e.credit || 0;
            if (e.account.startsWith('1201')) vatCredit = e.debit || e.credit || 0;
          }
        }
      }

      for (const rule of rules[ruleType]) {
        // For rules with grandTotal and paymentTypeMap, split by paymentEntries
        if (rule.amount === "grandTotal" && (rule.debit && (rule.debit === "1000|1010|1020"))) {
          for (const payment of paymentEntries) {
            const paymentTypeMap = rules.paymentTypeMap || {};
            let mapped = paymentTypeMap[payment.type] || paymentTypeMap["cash"];
            let accountNumber = mapped || rule.debit.split("|")[0];
            const acc = accounts.find((a) => a.accountNumber === accountNumber) || { accountNumber, accountName: "Unknown", note: "" };
            let amount = payment.amount;
            if (amount && amount > 0 && !isNaN(amount)) {
              entries.push({
                date: receipt.date,
                description: description || rule.description,
                accountNumber: acc.accountNumber,
                accountName: acc.accountName,
                debit: rule.debit ? amount : 0,
                credit: rule.credit ? amount : 0,
              });
            }
          }
        } else {
          // Original logic for other rules
          let accountNumber = rule.debit || rule.credit || "";
          if (accountNumber.includes("|")) {
            const paymentTypeMap = rules.paymentTypeMap || {};
            let mapped: string | undefined = undefined;
            // Use first payment type if available
            if (paymentEntries.length > 0) {
              mapped = paymentTypeMap[paymentEntries[0].type];
            }
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
          else if (rule.amount === "vatOutput") amount = vatOutput;
          else if (rule.amount === "vatInput") amount = vatInput;
          else if (rule.amount === "vatPayable") amount = vatPayable;
          else if (rule.amount === "vatCredit") amount = vatCredit;
          else if (rule.amount === "amount") {
            // For systemGenerated receipts (like vat_payment), use grand_total or entries sum
            if (typeof receipt.grand_total === 'number') amount = receipt.grand_total;
            else if (typeof receipt.grand_total === 'string') amount = parseFloat(receipt.grand_total);
            else if (Array.isArray(receipt.entries)) {
              amount = receipt.entries.reduce((sum, e) => sum + (e.debit || e.credit || 0), 0);
            }
          }
          else if (!isNaN(Number(rule.amount))) amount = Number(rule.amount);

          // Only add entry if amount > 0 and !isNaN(amount)
          if (amount && amount > 0 && !isNaN(amount)) {
            entries.push({
              date: receipt.date,
              description: description || rule.description,
              accountNumber: acc.accountNumber,
              accountName: acc.accountName,
              debit: rule.debit ? amount : 0,
              credit: rule.credit ? amount : 0,
            });
          }
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
