

let cachedTaxId: string | undefined;
let fetchPromise: Promise<string> | null = null;


/**
 * Get the company tax ID from the API (cached after first fetch).
 */
export async function getCompanyTaxId(): Promise<string> {
  if (cachedTaxId !== undefined) return cachedTaxId;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('/api/company-profile')
    .then(res => res.json())
    .then(data => {
      cachedTaxId = typeof data.tax_id === 'string' ? data.tax_id : '';
      return cachedTaxId || '';
    })
    .catch(() => {
      cachedTaxId = '';
      return '';
    });
  return fetchPromise.then(val => val || '');
}

// Utility to determine if a receipt is a sale (our org is the vendor)

// Async version for dynamic tax id
export async function isSale(receipt: { vendor_tax_id?: string }) {
  const taxId = await getCompanyTaxId();
  return receipt.vendor_tax_id === taxId;
}

// Utility to determine if a receipt is a purchase (our org is the buyer)

// Async version for dynamic tax id
export async function isPurchase(receipt: { buyer_tax_id?: string, vendor_tax_id?: string }) {
  const taxId = await getCompanyTaxId();
  return receipt.buyer_tax_id === taxId && receipt.vendor_tax_id && receipt.vendor_tax_id !== taxId;
}

// Utility to determine if a receipt is a sale (by type)
export function isSaleType(type: string | null | undefined) {
  return type && type === 'sale';
}

export function isPurchaseType(type: string | null | undefined) {
  return type && type === 'purchase';
}

export function isCapitalType(type: string | null | undefined) {
  return type && type === 'capital';
}
// Utility for formatting money values
export function formatMoney(val: number | string | null | undefined, defaultValue: string = ""): string {
  if (val === undefined || val === null || val === "") return defaultValue;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
