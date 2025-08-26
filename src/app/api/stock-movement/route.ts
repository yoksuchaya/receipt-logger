
import type { StockMovement } from "@/types/StockMovement";
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isPurchase, isPurchaseType, isSale, isSaleType } from '@/components/utils/utils';

const RECEIPT_LOG_FILE = path.join(process.cwd(), 'receipt-uploads.jsonl');


type Product = {
  name: string;
  weight?: string;
  quantity?: string;
  price?: string;
};

type Receipt = {
  date: string;
  type: string;
  products?: Product[];
  receipt_no?: string;
  category?: string;
};

function getMovementsWithOpening(receipts: Receipt[], month: number, year: number) {
  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  receipts = receipts.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const inventories: Record<string, {
    qty: number;
    total: number;
    avgCost: number;
    movements: StockMovement[];
  }> = {};
  const rows: StockMovement[] = [];

  // Helper to update inventory and optionally push a movement
  function updateInventory({
    inv, type, qty, price, date, r, name, isMovement
  }: {
    inv: { qty: number; total: number; avgCost: number; movements: StockMovement[] },
    type: string,
    qty: number,
    price: number,
    date: string | null,
    r: Receipt,
    name: string,
    isMovement: boolean
  }) {
    if (isPurchaseType(type)) {
      inv.qty = round3(inv.qty + qty);
      inv.total = round3(inv.total + price);
      inv.avgCost = inv.qty ? round3(inv.total / inv.qty) : 0;
      if (isMovement) {
        inv.movements.push({
          date,
          type,
          qty: round3(qty).toFixed(3),
          unitCost: round3(price / qty).toFixed(3),
          total: round3(price).toFixed(3),
          desc: r.receipt_no ? `เอกสารเลขที่ ${r.receipt_no}` : (r.category || ''),
          balanceQty: round3(inv.qty).toFixed(3),
          balanceAvgCost: round3(inv.avgCost).toFixed(3),
          balanceTotal: round3(inv.total).toFixed(3),
          product: name
        });
      }
    } else if (isSaleType(type)) {
      const cogs = round3(qty * inv.avgCost);
      inv.qty = round3(inv.qty - qty);
      inv.total = round3(inv.total - cogs);
      if (isMovement) {
        inv.movements.push({
          date,
          type,
          qty: round3(qty).toFixed(3),
          unitCost: round3(inv.avgCost).toFixed(3),
          total: round3(cogs).toFixed(3),
          desc: r.receipt_no ? `เอกสารเลขที่ ${r.receipt_no}` : (r.category || ''),
          balanceQty: round3(inv.qty).toFixed(3),
          balanceAvgCost: round3(inv.avgCost).toFixed(3),
          balanceTotal: round3(inv.total).toFixed(3),
          product: name
        });
      }
    }
  }

  // 1. Process all receipts before the selected month to get opening balances
  for (const r of receipts) {
    const date = r.date;
    const d = new Date(date);
    if (d.getFullYear() > year || (d.getFullYear() === year && d.getMonth() + 1 >= month)) continue;
    const type = r.type;
    const products = r.products || [];
    for (const p of products) {
      const name = p.name;
      const qtyRaw = p.weight !== undefined ? p.weight : p.quantity;
      const qty = parseFloat(qtyRaw || '0');
      if (!qty || isNaN(qty)) continue;
      const price = parseFloat(p.price || '0');
      if (!inventories[name]) {
        inventories[name] = { qty: 0, total: 0, avgCost: 0, movements: [] };
      }
      const inv = inventories[name];
      updateInventory({ inv, type, qty, price, date: null, r, name, isMovement: false });
    }
  }
  // 2. Add opening balance movement for each product if any
  Object.entries(inventories).forEach(([name, inv]) => {
    if (inv.qty !== 0) {
      inv.movements.push({
        date: null,
        type: 'opening',
        qty: round3(inv.qty).toFixed(3),
        unitCost: round3(inv.avgCost).toFixed(3),
        total: round3(inv.total).toFixed(3),
        desc: 'ยอดยกมา',
        balanceQty: round3(inv.qty).toFixed(3),
        balanceAvgCost: round3(inv.avgCost).toFixed(3),
        balanceTotal: round3(inv.total).toFixed(3),
        product: name
      });
    }
  });
  // 3. Process receipts for the selected month
  for (const r of receipts) {
    const date = r.date;
    const d = new Date(date);
    if (!(d.getFullYear() === year && d.getMonth() + 1 === month)) continue;
    const type = r.type;
    const products = r.products || [];
    for (const p of products) {
      const name = p.name;
      const qtyRaw = p.weight !== undefined ? p.weight : p.quantity;
      const qty = parseFloat(qtyRaw || '0');
      if (!qty || isNaN(qty)) continue;
      const price = parseFloat(p.price || '0');
      if (!inventories[name]) {
        inventories[name] = { qty: 0, total: 0, avgCost: 0, movements: [] };
      }
      const inv = inventories[name];
      updateInventory({ inv, type, qty, price, date, r, name, isMovement: true });
    }
  }
  Object.values(inventories).forEach(inv => {
    rows.push(...inv.movements);
  });
  rows.sort((a, b) => {
    if (a.type === 'opening') return -1;
    if (b.type === 'opening') return 1;
    // Handle null dates (opening balance)
    if (!a.date && !b.date) return 0;
    if (!a.date) return -1;
    if (!b.date) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  return rows;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '0', 10);
    const year = parseInt(searchParams.get('year') || '0', 10);
    if (!month || !year) return NextResponse.json([], { status: 400 });
    const data = await fs.readFile(RECEIPT_LOG_FILE, 'utf8');
    const receipts = data.split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line) as Receipt; } catch { return null; }
    }).filter((r): r is Receipt => r !== null);
    const rows = getMovementsWithOpening(receipts, month, year);

    // Fetch company profile from API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/company-profile`);
    if (!res.ok) throw new Error('Failed to fetch company profile');
    const companyProfile = await res.json();
    const productOptions = companyProfile.productOptions || {};
    function getProductType(product: string | undefined): string {
      if (!product) return 'อื่นๆ';
      for (const [type, names] of Object.entries(productOptions)) {
        if (Array.isArray(names) && names.some((n: string) => n === product)) {
          if (type === 'ornament') return 'ทองรูปพรรณ 96.5%';
          if (type === 'bullion') return 'ทองแท่ง 96.5%';
          return type;
        }
      }
      return 'อื่นๆ';
    }
    const rowsWithType = rows.map(row => ({ ...row, productType: getProductType(row.product) }));
    return NextResponse.json(rowsWithType);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load stock movement' }, { status: 500 });
  }
}
