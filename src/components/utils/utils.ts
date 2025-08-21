// Utility to determine if a receipt is a sale (our org is the vendor)
export function isSale(receipt: { vendor_tax_id?: string }) {
  return receipt.vendor_tax_id === '0735559006568';
}

// Utility to determine if a receipt is a purchase (our org is the buyer)
export function isPurchase(receipt: { buyer_tax_id?: string, vendor_tax_id?: string }) {
  return receipt.buyer_tax_id === '0735559006568' && receipt.vendor_tax_id && receipt.vendor_tax_id !== '0735559006568';
}
// Utility for formatting money values
export function formatMoney(val: number | string | null | undefined, defaultValue: string = ""): string {
  if (val === undefined || val === null || val === "") return defaultValue;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
