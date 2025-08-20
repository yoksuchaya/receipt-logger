import React, { useEffect, useState } from "react";
import VatReportHeader from "./VatReportHeader";
import { formatMoney } from "./utils";

// Helper to get current month/year as string
function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    year: now.getFullYear().toString(),
  };
}

interface StockMovementRow {
  product: string;
  date: string;
  type: string;
  qty: number;
  unitCost: number;
  total: number;
  desc: string;
  balanceQty: number;
  balanceAvgCost: number;
  balanceTotal: number;
}
export default function StockMovementReport() {
  const [month, setMonth] = useState(getCurrentMonthYear().month);
  const [year, setYear] = useState(getCurrentMonthYear().year);
  const [rows, setRows] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month/year options (same as VatReport)
  const yearOptions = [];
  for (let y = 2020; y <= 2025; y++) yearOptions.push(y.toString());
  const monthOptions = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stock-movement?month=${month}&year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
        return res.json();
      })
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
  <div className="w-full bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6 flex flex-col">
      <VatReportHeader
        month={month}
        year={year}
        monthOptions={monthOptions}
        yearOptions={yearOptions}
        onMonthChange={setMonth}
        onYearChange={setYear}
        title="รายงานความเคลื่อนไหวสต๊อก"
      />
      {loading && <div>กำลังโหลด...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-800">
                <th className="px-2 py-1 border">วันที่</th>
                <th className="px-2 py-1 border">สินค้า</th>
                <th className="px-2 py-1 border">ประเภท</th>
                <th className="px-2 py-1 border text-right">ซื้อ/ขาย</th>
                <th className="px-2 py-1 border text-right">ราคาต่อหน่วย</th>
                <th className="px-2 py-1 border text-right">รวม</th>
                <th className="px-2 py-1 border text-right">คงเหลือ (จำนวน)</th>
                <th className="px-2 py-1 border text-right">คงเหลือ (ต้นทุนเฉลี่ย)</th>
                <th className="px-2 py-1 border text-right">คงเหลือ (มูลค่า)</th>
                <th className="px-2 py-1 border">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={10} className="text-center py-4">ไม่มีข้อมูล</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.date}</td>
                  <td className="border px-2 py-1">{row.product}</td>
                  <td className="border px-2 py-1">{row.type === 'in' ? 'ซื้อ' : row.type === 'out' ? 'ขาย' : row.type === 'opening' ? 'ยกมา' : row.type}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.qty, "-")}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.unitCost, "-")}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.total, "-")}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.balanceQty, "-")}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.balanceAvgCost, "-")}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(row.balanceTotal, "-")}</td>
                  <td className="border px-2 py-1">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}