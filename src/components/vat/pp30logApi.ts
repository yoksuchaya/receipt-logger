import { PP30Log } from "../types/PP30Log";

export async function getPP30Log(month: string, year: string): Promise<PP30Log | null> {
  const res = await fetch(`/api/pp30-log?month=${month}&year=${year}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  return data;
}
