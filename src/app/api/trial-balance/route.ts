import { NextRequest } from "next/server";

// Helper to fetch and parse JSON
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

// Map ledger and account chart to trial balance rows
function mapTrialBalanceRows(ledger: any[], accountTypeMap: Record<string, string>) {
  return ledger.map((row: any) => {
    const accountType = accountTypeMap[row.accountNumber] || "asset";
    let openingDebit = 0, openingCredit = 0;
    if (accountType === "asset" || accountType === "expense") {
      openingDebit = row.openingBalance > 0 ? row.openingBalance : 0;
      openingCredit = row.openingBalance < 0 ? row.openingBalance : 0;
    } else if (accountType === "liability" || accountType === "equity" || accountType === "revenue") {
      openingCredit = row.openingBalance > 0 ? row.openingBalance : 0;
      openingDebit = row.openingBalance < 0 ? row.openingBalance : 0;
    } else if (accountType === "contra-asset") {
      openingCredit = row.openingBalance > 0 ? row.openingBalance : 0;
      openingDebit = row.openingBalance < 0 ? row.openingBalance : 0;
    }
    let debit = 0, credit = 0;
    if (Array.isArray(row.entries)) {
      row.entries.forEach((entry: any) => {
        debit += entry.debit || 0;
        credit += entry.credit || 0;
      });
    }
    // Calculate closing balance using account type logic
    let closingDebit = 0, closingCredit = 0;
    const closingBalance = (row.openingBalance || 0) + (debit - credit);
    if (accountType === "asset" || accountType === "expense") {
      closingDebit = closingBalance > 0 ? closingBalance : 0;
      closingCredit = closingBalance < 0 ? closingBalance : 0;
    } else if (accountType === "liability" || accountType === "equity" || accountType === "revenue") {
      if (debit - credit !== 0) {
        closingCredit = closingBalance < 0 ? closingBalance : 0;
        closingDebit = closingBalance > 0 ? closingBalance : 0;
      } else {
        closingCredit = closingBalance > 0 ? closingBalance : 0;
        closingDebit = closingBalance < 0 ? closingBalance : 0;
      }
    } else if (accountType === "contra-asset") {
      closingCredit = closingBalance > 0 ? closingBalance : 0;
      closingDebit = closingBalance < 0 ? closingBalance : 0;
    }
    return {
      accountNumber: row.accountNumber,
      accountName: row.accountName,
      openingDebit: Math.abs(openingDebit),
      openingCredit: Math.abs(openingCredit),
      debit: Math.abs(debit),
      credit: Math.abs(credit),
      closingDebit: Math.abs(closingDebit),
      closingCredit: Math.abs(closingCredit),
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) {
    return new Response(JSON.stringify({ error: "Missing month parameter" }), { status: 400 });
  }
  try {
    // Fetch ledger and account chart using relative paths
    const [ledgerRes, chartRes] = await Promise.all([
      fetchJson(`${req.nextUrl.origin}/api/ledger-report?month=${month}`),
      fetchJson(`${req.nextUrl.origin}/api/account-chart`)
    ]);
    // Build account type map
    const accountTypeMap: Record<string, string> = {};
    if (Array.isArray(chartRes.accounts)) {
      chartRes.accounts.forEach((acc: any) => {
        accountTypeMap[acc.accountNumber] = acc.type;
      });
    }
    // Map ledger to trial balance rows
    const ledger = Array.isArray(ledgerRes.ledger) ? ledgerRes.ledger : [];
    const trialBalance = mapTrialBalanceRows(ledger, accountTypeMap);
    return new Response(JSON.stringify({ month, trialBalance }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
