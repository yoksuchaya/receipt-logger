import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { isCapitalType, isPurchaseType, isSaleType } from '@/components/utils/utils';
import type { Receipt } from "@/types/Receipt";
import type { StockMovement } from "@/types/StockMovement";

interface Account {
  accountNumber: string;
  accountName: string;
  note: string;
  type?: 'asset' | 'liability' | 'revenue' | 'expense' | string;
}

interface LedgerEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface LedgerAccount {
  accountNumber: string;
  accountName: string;
  openingBalance: number;
  entries: LedgerEntry[];
}

function parseMonth(date: string) {
  return date.slice(0, 7);
}

function getAccountMap(accounts: Account[]) {
  const map: Record<string, Account> = {};
  for (const acc of accounts) {
    map[acc.accountNumber] = acc;
  }
  return map;
}

// Helper to get account number by name keyword
function findAccountNumber(accounts: Account[], keyword: string): string | undefined {
  const acc = accounts.find(a => a.accountName.includes(keyword));
  return acc?.accountNumber;
}


// Rules-based logic for ledger entries
function getAccountsForReceipt(receipt: Receipt, accounts: Account[], rules: any, stockMovements: StockMovement[]) {
  let ruleType: string | null = null;
  if (isPurchaseType(receipt.type)) ruleType = "purchase";
  else if (isSaleType(receipt.type)) ruleType = "sale";
  else if (isCapitalType(receipt.type)) ruleType = "capital";
  if (!ruleType || !rules[ruleType]) return [];

  const grandTotal = parseFloat(receipt.grand_total);
  const vat = parseFloat(receipt.vat);
  const net = grandTotal - vat;
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

  const entries: { accountNumber: string; debit: number; credit: number; description?: string }[] = [];
  // Infer payment_type if missing
  let paymentType = receipt.payment_type;
  if (!paymentType && receipt.payment) {
    if (receipt.payment.transfer && receipt.payment.transfer !== "") paymentType = "transfer";
    else if (receipt.payment.cash && receipt.payment.cash !== "") paymentType = "cash";
    else if (receipt.payment.credit_card && receipt.payment.credit_card !== "") paymentType = "cash";
  }
  for (const rule of rules[ruleType]) {
    // Determine account number (handle payment type for cash/bank using paymentTypeMap)
    let accountNumber = rule.debit || rule.credit || "";
    if (accountNumber.includes("|")) {
      const paymentTypeMap = rules.paymentTypeMap || {};
      let mapped: string | undefined = undefined;
      if (paymentType) {
        mapped = paymentTypeMap[paymentType];
      }
      if (mapped && accountNumber.split("|").includes(mapped)) {
        accountNumber = mapped;
      } else {
        accountNumber = accountNumber.split("|")[0];
      }
    }
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
        accountNumber,
        debit: rule.debit ? amount : 0,
        credit: rule.credit ? amount : 0,
        description: rule.description
      });
    }
  }
  return entries;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  const accountNumber = searchParams.get('accountNumber');

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: 'Invalid or missing month' }, { status: 400 });
  }

  // Fetch stock-movement for the month for COGS calculation
  let stockMovements: StockMovement[] = [];
  let y = 0, m = 0;
  [y, m] = monthParam.split('-').map(Number);
  if (y && m) {
    const stockMovementUrl = `${req.nextUrl.origin}/api/stock-movement?month=${m}&year=${y}`;
    const res = await fetch(stockMovementUrl);
    if (res.ok) {
      stockMovements = await res.json();
    }
  }

  // Fetch accounts from API
  let accounts: Account[] = [];
  let rules: any = {};
  try {
    const accountChartRes = await fetch(`${req.nextUrl.origin}/api/account-chart`);
    if (!accountChartRes.ok) throw new Error('Failed to fetch account chart');
    const accountChart = await accountChartRes.json();
    accounts = Array.isArray(accountChart) ? accountChart : accountChart.accounts;
    rules = Array.isArray(accountChart) ? {} : accountChart.rules;
  } catch (e) {
    return NextResponse.json({ error: 'Cannot read account chart' }, { status: 500 });
  }
  const accountMap = getAccountMap(accounts);

  // Fetch receipts from API
  let receipts: Receipt[] = [];
  try {
    const receiptsRes = await fetch(`${req.nextUrl.origin}/api/receipt-log`);
    if (!receiptsRes.ok) throw new Error('Failed to fetch receipts');
    receipts = await receiptsRes.json();
  } catch (e) {
    return NextResponse.json({ error: 'Cannot read receipts' }, { status: 500 });
  }

  // Build ledger per account
  const ledger: Record<string, LedgerAccount> = {};
  for (const acc of accounts) {
    ledger[acc.accountNumber] = {
      accountNumber: acc.accountNumber,
      accountName: acc.accountName,
      openingBalance: 0,
      entries: [],
    };
  }

  // Calculate opening balances (sum of all transactions before the month), using account type
  for (const receipt of receipts) {
    const rMonth = parseMonth(receipt.date);
    if (rMonth >= monthParam) continue;
    // Patch: inject weighted avg COGS for sales
    const accs = getAccountsForReceipt(receipt, accounts, rules, stockMovements);
    for (const acc of accs) {
      if (!ledger[acc.accountNumber]) continue;
      const accType = accountMap[acc.accountNumber]?.type;
      if (accType === 'liability' || accType === 'revenue' || accType === 'equity') {
        ledger[acc.accountNumber].openingBalance += acc.credit - acc.debit;
      } else {
        ledger[acc.accountNumber].openingBalance += acc.debit - acc.credit;
      }
    }
  }

  // Add transactions for the month
  for (const receipt of receipts) {
    const rMonth = parseMonth(receipt.date);
    if (rMonth !== monthParam) continue;
    // Patch: inject weighted avg COGS for sales
    const accs2 = getAccountsForReceipt(receipt, accounts, rules, stockMovements);
    for (const acc of accs2) {
      if (!ledger[acc.accountNumber]) continue;
      ledger[acc.accountNumber].entries.push({
        date: receipt.date,
        description: acc.description || receipt.notes,
        reference: receipt.receipt_no || '',
        debit: acc.debit,
        credit: acc.credit,
        runningBalance: 0
      });
    }
  }

  // Compute running balances using account type
  for (const accNum in ledger) {
    let bal = ledger[accNum].openingBalance;
    const accType = accountMap[accNum]?.type;
    ledger[accNum].entries.sort((a, b) => a.date.localeCompare(b.date));
    for (const entry of ledger[accNum].entries) {
      if (accType === 'liability' || accType === 'revenue' || accType === 'equity') {
        bal += entry.credit - entry.debit;
      } else {
        // asset, expense, or unknown (default to debit-credit)
        bal += entry.debit - entry.credit;
      }
      entry.runningBalance = bal;
    }
  }

  // Filter by accountNumber if provided
  let result: LedgerAccount[] = Object.values(ledger);
  if (accountNumber) {
    if (!ledger[accountNumber]) {
      return NextResponse.json({ error: 'Invalid accountNumber' }, { status: 400 });
    }
    result = [ledger[accountNumber]];
  }

  // Remove accounts with no activity and zero opening balance
  result = result.filter(acc => acc.openingBalance !== 0 || acc.entries.length > 0);

  return NextResponse.json({ month: monthParam, ledger: result });
}
