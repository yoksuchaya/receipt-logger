// Utility to determine if a receipt is a sale (our org is the vendor)
export function isSale(receipt: { vendor_tax_id?: string }, companyTaxId?: string) {
  return receipt.vendor_tax_id === companyTaxId;
}

// Utility to determine if a receipt is a purchase (our org is the buyer)
export function isPurchase(receipt: { buyer_tax_id?: string, vendor_tax_id?: string }, companyTaxId?: string) {
  return receipt.buyer_tax_id === companyTaxId && receipt.vendor_tax_id && receipt.vendor_tax_id !== companyTaxId;
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

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
