// Type for PP30 log
export interface PP30Log {
  month: string;
  year: string;
  status: 'draft' | 'submitted' | 'paid';
  amount: number;
  created_at: string;
  updated_at?: string;
}
