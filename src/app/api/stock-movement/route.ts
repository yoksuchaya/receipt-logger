import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

const RECEIPT_LOG_FILE = path.join(process.cwd(), 'receipt-uploads.jsonl');


function getMovementsWithOpening(receipts: any[], month: number, year: number) {
  // Helper to round to 3 decimal places
  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  // Sort all receipts by date ascending
  receipts = receipts.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const inventories: Record<string, {
    qty: number;
    total: number;
    avgCost: number;
    movements: any[];
  }> = {};
  const rows: any[] = [];
  // 1. Process all receipts before the selected month to get opening balances
  for (const r of receipts) {
    const date = r.date;
    const d = new Date(date);
    if (d.getFullYear() > year || (d.getFullYear() === year && d.getMonth() + 1 >= month)) continue;
    let type = r.type;
    const products = r.products || [];
    for (const p of products) {
      const name = p.name;
      // Exclude non-stock items: skip if weight and quantity are missing or zero
      const qtyRaw = p.weight !== undefined ? p.weight : p.quantity;
      const qty = parseFloat(qtyRaw || '0');
      if (!qty || isNaN(qty)) continue;
      const price = parseFloat(p.price || '0');
      // Use 3 decimal digits for qty, avgCost, unitCost, total
      const round3 = (n: number) => Math.round(n * 1000) / 1000;
      if (!inventories[name]) {
        inventories[name] = { qty: 0, total: 0, avgCost: 0, movements: [] };
      }
      const inv = inventories[name];
      if (type === 'purchase') {
        inv.qty = round3(inv.qty + qty);
        inv.total = round3(inv.total + price);
        inv.avgCost = inv.qty ? round3(inv.total / inv.qty) : 0;
      } else if (type === 'sale') {
        const cogs = round3(qty * inv.avgCost);
        inv.qty = round3(inv.qty - qty);
        inv.total = round3(inv.total - cogs);
      }
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
    let type = r.type;
    const products = r.products || [];
    for (const p of products) {
      const name = p.name;
      // Exclude non-stock items: skip if weight and quantity are missing or zero
      const qtyRaw = p.weight !== undefined ? p.weight : p.quantity;
      const qty = parseFloat(qtyRaw || '0');
      if (!qty || isNaN(qty)) continue;
      const price = parseFloat(p.price || '0');
      if (!inventories[name]) {
        inventories[name] = { qty: 0, total: 0, avgCost: 0, movements: [] };
      }
      const inv = inventories[name];
      if (type === 'purchase') {
        inv.qty = round3(inv.qty + qty);
        inv.total = round3(inv.total + price);
        inv.avgCost = inv.qty ? round3(inv.total / inv.qty) : 0;
        inv.movements.push({
          date,
          type: 'in',
          qty: round3(qty).toFixed(3),
          unitCost: round3(price / qty).toFixed(3),
          total: round3(price).toFixed(3),
          desc: r.receipt_no ? `เอกสารเลขที่ ${r.receipt_no}` : (r.category || ''),
          balanceQty: round3(inv.qty).toFixed(3),
          balanceAvgCost: round3(inv.avgCost).toFixed(3),
          balanceTotal: round3(inv.total).toFixed(3),
          product: name
        });
      } else if (type === 'sale') {
        const cogs = round3(qty * inv.avgCost);
        inv.qty = round3(inv.qty - qty);
        inv.total = round3(inv.total - cogs);
        inv.movements.push({
          date,
          type: 'out',
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
  // Flatten all movements
  Object.values(inventories).forEach(inv => {
    rows.push(...inv.movements);
  });
  // Sort by date (opening first, then by date)
  rows.sort((a, b) => {
    if (a.type === 'opening') return -1;
    if (b.type === 'opening') return 1;
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
      try { return JSON.parse(line); } catch { return null; }
    }).filter((r): r is any => r !== null);
  const rows = getMovementsWithOpening(receipts, month, year);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load stock movement' }, { status: 500 });
  }
}
