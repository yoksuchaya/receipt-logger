// Common Receipt type for backend and frontend
export type Receipt = {
  date: string;
  grand_total: string;
  vat: string;
  vendor: string;
  buyer_name: string;
  category: string;
  payment_type: "cash" | "transfer";
  notes: string;
  vendor_tax_id?: string;
  buyer_tax_id?: string;
  type?: string;
  receipt_no?: string;
  products?: Array<{
    name?: string;
    weight?: string;
    quantity?: string;
    pricePerItem?: string;
    price?: string;
  }>;
};
