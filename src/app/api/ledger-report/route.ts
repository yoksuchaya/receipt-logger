import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

interface Account {
  accountNumber: string;
  accountName: string;
  note: string;
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
  const isPurchase = receipt.category.startsWith('ซื้อ');
  const isSale = receipt.category.startsWith('ขาย');

  // Find relevant accounts
  const accStock = findAccountNumber(accounts, 'สต๊อกทอง');
  const accBank = findAccountNumber(accounts, 'เงินฝากธนาคาร');
  const accCash = findAccountNumber(accounts, 'เงินสดในร้าน');
  const accSales = findAccountNumber(accounts, 'ขายทอง');
  const accVatInput = findAccountNumber(accounts, 'VAT Input');
  const accVatOutput = findAccountNumber(accounts, 'VAT Output');
  const accCOGS = findAccountNumber(accounts, 'ต้นทุนขาย'); // COGS (Cost of Goods Sold)

  const entries: { accountNumber: string; debit: number; credit: number }[] = [];

  if (isPurchase && accStock && (accBank || accCash)) {
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
  } else if (isSale && (accBank || accCash) && accSales) {
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
    // TODO: The correct COGS (ต้นทุนขาย) amount should be calculated using the FIFO method for inventory costing.
    // This is a placeholder using the sale amount as the cost.
    // Inventory movement for sale: Credit stock, Debit COGS
    if (accStock && accCOGS) {
      entries.push({ accountNumber: accCOGS, debit: amount, credit: 0 });
      entries.push({ accountNumber: accStock, debit: 0, credit: amount });
    }
  }
  // You can add more logic for other types if needed
  return entries;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const accountNumber = searchParams.get('accountNumber');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid or missing month' }, { status: 400 });
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

  // Calculate opening balances (sum of all transactions before the month)
  for (const receipt of receipts) {
    const rMonth = parseMonth(receipt.date);
    if (rMonth >= month) continue;
    for (const acc of getAccountsForReceipt(receipt, accounts)) {
      if (!ledger[acc.accountNumber]) continue;
      ledger[acc.accountNumber].openingBalance += acc.debit - acc.credit;
    }
  }

  // Add transactions for the month
  for (const receipt of receipts) {
    const rMonth = parseMonth(receipt.date);
    if (rMonth !== month) continue;
    for (const acc of getAccountsForReceipt(receipt, accounts)) {
      if (!ledger[acc.accountNumber]) continue;
      ledger[acc.accountNumber].entries.push({
        date: receipt.date,
        description: receipt.notes,
        reference: receipt.receipt_no,
        debit: acc.debit,
        credit: acc.credit,
        runningBalance: 0, // will fill later
      });
    }
  }

  // Compute running balances
  for (const accNum in ledger) {
    let bal = ledger[accNum].openingBalance;
    ledger[accNum].entries.sort((a, b) => a.date.localeCompare(b.date));
    for (const entry of ledger[accNum].entries) {
      bal += entry.debit - entry.credit;
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

  return NextResponse.json({ month, ledger: result });
}
