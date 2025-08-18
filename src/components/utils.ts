// Utility for formatting money values
export function formatMoney(val: number | string | null | undefined, defaultValue: string = ""): string {
  if (val === undefined || val === null || val === "") return defaultValue;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
