import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { isPurchase, isSale } from '@/components/utils/utils';

interface Account {
  accountNumber: string;
  accountName: string;
  note: string;
  type?: 'asset' | 'liability' | 'revenue' | 'expense' | string;
}

interface Receipt {
  date: string; // YYYY-MM-DD
  grand_total: string;
  vat: string;
  vendor: string;
  vendor_tax_id: string;
  category: string;
  notes: string;
  payment_type: string;
  receipt_no: string;
  buyer_name: string;
  buyer_address: string;
  buyer_tax_id: string;
  item: string;
  weight_grams?: number;
  weight_baht?: number;
  purity: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
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

const RECEIPT_FILE = path.join(process.cwd(), 'receipt-uploads.jsonl');
const ACCOUNT_FILE = path.join(process.cwd(), 'account-chart.json');

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

// Real logic: determine debit/credit accounts based on receipt type and account chart
function getAccountsForReceipt(receipt: Receipt, accounts: Account[]) {
  const amount = Number(receipt.grand_total);
  const vatAmount = Number(receipt.vat || 0);
  // Use the same logic as receipt-log API for purchase/sale
  const sale = isSale(receipt);
  const purchase = isPurchase(receipt);

  // Find relevant accounts
  const accStock = findAccountNumber(accounts, 'สต๊อกทอง');
  const accBank = findAccountNumber(accounts, 'เงินฝากธนาคาร');
  const accCash = findAccountNumber(accounts, 'เงินสดในร้าน');
  const accSales = findAccountNumber(accounts, 'ขายทอง');
  const accVatInput = findAccountNumber(accounts, 'VAT Input');
  const accVatOutput = findAccountNumber(accounts, 'VAT Output');
  const accCOGS = findAccountNumber(accounts, 'ต้นทุนขาย'); // COGS (Cost of Goods Sold)

  const entries: { accountNumber: string; debit: number; credit: number }[] = [];

  if (purchase && accStock && (accBank || accCash)) {
    // Purchase: Debit stock, Credit bank/cash, VAT input if present
    entries.push({ accountNumber: accStock, debit: amount, credit: 0 });
    if (vatAmount > 0 && accVatInput) {
      entries.push({ accountNumber: accVatInput, debit: vatAmount, credit: 0 });
      // Credit bank/cash for total (amount + vat)
      const total = amount + vatAmount;
      entries.push({ accountNumber: accBank || accCash || '', debit: 0, credit: total });
    } else {
      entries.push({ accountNumber: accBank || accCash || '', debit: 0, credit: amount });
    }
  } else if (sale && (accBank || accCash) && accSales) {
    // Sale: Debit cash/bank, Credit sales, VAT output if present
    if (vatAmount > 0 && accVatOutput) {
      // Debit cash/bank for total (amount + vat)
      const total = amount + vatAmount;
      entries.push({ accountNumber: accBank || accCash || '', debit: total, credit: 0 });
      entries.push({ accountNumber: accSales || '', debit: 0, credit: amount });
      entries.push({ accountNumber: accVatOutput || '', debit: 0, credit: vatAmount });
    } else {
      entries.push({ accountNumber: accBank || accCash || '', debit: amount, credit: 0 });
      entries.push({ accountNumber: accSales || '', debit: 0, credit: amount });
    }
    // Weighted average COGS and inventory (1100) using stock-movement API
    // This is async, so we will patch the main GET to inject the correct COGS per receipt
    // For now, push a placeholder, will be replaced in GET
    if (accStock && accCOGS) {
      entries.push({ accountNumber: accCOGS, debit: -1, credit: 0 }); // -1 means to be filled in GET
      entries.push({ accountNumber: accStock, debit: 0, credit: -1 });
    }
  }
  // You can add more logic for other types if needed
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
  let stockMovements: any[] = [];
  let y = 0, m = 0;
  [y, m] = monthParam.split('-').map(Number);
  if (y && m) {
    const stockMovementUrl = `${req.nextUrl.origin}/api/stock-movement?month=${m}&year=${y}`;
    const res = await fetch(stockMovementUrl);
    if (res.ok) {
      stockMovements = await res.json();
    }
  }

  // Read accounts
  let accounts: Account[] = [];
  try {
    const accRaw = await fs.readFile(ACCOUNT_FILE, 'utf-8');
    accounts = JSON.parse(accRaw);
  } catch (e) {
    return NextResponse.json({ error: 'Cannot read account chart' }, { status: 500 });
  }
  const accountMap = getAccountMap(accounts);

  // Read receipts
  let receipts: Receipt[] = [];
  try {
    const lines = (await fs.readFile(RECEIPT_FILE, 'utf-8')).split('\n').filter(Boolean);
    receipts = lines.map(line => JSON.parse(line));
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
    let accs = getAccountsForReceipt(receipt, accounts);
    if (isSale(receipt) && receipt.receipt_no && stockMovements.length > 0) {
      const outs = stockMovements.filter((m: any) => m.type === 'out' && m.desc && m.desc.includes('เอกสารเลขที่'))
        .filter((m: any) => {
          const match = m.desc.match(/เอกสารเลขที่\s*(\S+)/);
          return match && match[1] === receipt.receipt_no;
        });
      const cogs = outs.reduce((sum: number, m: any) => {
        const qty = parseFloat(m.qty);
        const avgCost = parseFloat(m.balanceAvgCost);
        if (!isNaN(qty) && !isNaN(avgCost)) {
          return sum + qty * avgCost;
        }
        return sum;
      }, 0);
      accs = accs.map(acc => {
        if (acc.debit === -1) return { ...acc, debit: cogs };
        if (acc.credit === -1) return { ...acc, credit: cogs };
        return acc;
      });
    }
    for (const acc of accs) {
      if (!ledger[acc.accountNumber]) continue;
      const accType = accountMap[acc.accountNumber]?.type;
      if (accType === 'liability' || accType === 'revenue') {
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
    let accs2 = getAccountsForReceipt(receipt, accounts);
    if (isSale(receipt) && receipt.receipt_no && stockMovements.length > 0) {
      const outs = stockMovements.filter((m: any) => m.type === 'out' && m.desc && m.desc.includes('เอกสารเลขที่'))
        .filter((m: any) => {
          const match = m.desc.match(/เอกสารเลขที่\s*(\S+)/);
          return match && match[1] === receipt.receipt_no;
        });
      const cogs = outs.reduce((sum: number, m: any) => {
        const qty = parseFloat(m.qty);
        const avgCost = parseFloat(m.balanceAvgCost);
        if (!isNaN(qty) && !isNaN(avgCost)) {
          return sum + qty * avgCost;
        }
        return sum;
      }, 0);
      accs2 = accs2.map(acc => {
        if (acc.debit === -1) return { ...acc, debit: cogs };
        if (acc.credit === -1) return { ...acc, credit: cogs };
        return acc;
      });
    }
    for (const acc of accs2) {
      if (!ledger[acc.accountNumber]) continue;
      ledger[acc.accountNumber].entries.push({
        date: receipt.date,
        description: acc.accountNumber === "5000" || acc.accountNumber === "1100" ? "ต้นทุนทองที่ขาย" : receipt.notes,
        reference: receipt.receipt_no,
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
      if (accType === 'liability' || accType === 'revenue') {
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
