// Common StockMovement type for inventory and COGS calculation
export type StockMovement = {
  date?: string | null;
  type: string;
  qty?: string;
  unitCost?: string;
  total?: string;
  desc?: string;
  balanceQty?: string;
  balanceAvgCost?: string;
  balanceTotal?: string;
  product?: string;
};
