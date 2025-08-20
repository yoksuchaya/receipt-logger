import React, { useEffect, useState } from "react";
import VatReportHeader from "./VatReportHeader";
import { formatMoney } from "./utils";
import PrintWrapper from "./PrintWrapper";

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
  // Helper: extract type from product name (customize as needed)
  function getProductType(product: string) {
    if (!product) return "อื่นๆ";
    if (product.includes("รูปพรรณ")) return "ทองรูปพรรณ";
    if (product.includes("แท่ง")) return "ทองแท่ง";
    return "อื่นๆ";
  }

  // State and hooks
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

  // Calculate summary values
  const totalIn = rows.filter(r => r.type === 'in').reduce((sum, r) => sum + (typeof r.total === 'number' ? r.total : parseFloat(r.total || 0)), 0);
  const totalOut = rows.filter(r => r.type === 'out').reduce((sum, r) => sum + (typeof r.total === 'number' ? r.total : parseFloat(r.total || 0)), 0);
  // Find last row for ending balance
  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
  const endingValue = lastRow ? (typeof lastRow.balanceTotal === 'number' ? lastRow.balanceTotal : parseFloat(lastRow.balanceTotal || 0)) : 0;
  const endingAvgCost = lastRow ? (typeof lastRow.balanceAvgCost === 'number' ? lastRow.balanceAvgCost : parseFloat(lastRow.balanceAvgCost || 0)) : 0;
  // Today's date for signature
  const today = new Date();
  const todayStr = today.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });


  // Group rows by product type and calculate summary for each type
  const typeGroups: Record<string, StockMovementRow[]> = {};
  rows.forEach(row => {
    const type = getProductType(row.product);
    if (!typeGroups[type]) typeGroups[type] = [];
    typeGroups[type].push(row);
  });
  const typeSummaries = Object.entries(typeGroups).map(([type, groupRows]) => {
    const totalIn = groupRows.filter(r => r.type === 'in').reduce((sum, r) => sum + (typeof r.total === 'number' ? r.total : parseFloat(r.total || 0)), 0);
    const totalOut = groupRows.filter(r => r.type === 'out').reduce((sum, r) => sum + (typeof r.total === 'number' ? r.total : parseFloat(r.total || 0)), 0);
    const lastRow = groupRows.length > 0 ? groupRows[groupRows.length - 1] : null;
    const endingValue = lastRow ? (typeof lastRow.balanceTotal === 'number' ? lastRow.balanceTotal : parseFloat(lastRow.balanceTotal || 0)) : 0;
    const endingAvgCost = lastRow ? (typeof lastRow.balanceAvgCost === 'number' ? lastRow.balanceAvgCost : parseFloat(lastRow.balanceAvgCost || 0)) : 0;
    return { type, totalIn, totalOut, endingValue, endingAvgCost };
  });

  return (
    <PrintWrapper printLabel="รายงานความเคลื่อนไหวสต๊อก" printButtonLabel="พิมพ์รายงานสต๊อก">
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
          <>
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
            {/* Per-type summary tables below main table */}
            {typeSummaries.map((summary) => (
              <div key={summary.type} className="w-full max-w-lg mt-8">
                <div className="font-bold mb-2">สรุปประเภท: {summary.type}</div>
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 w-1/2">รายการ</th>
                      <th className="border px-2 py-1">มูลค่า (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium border px-2 py-1 w-1/2">รวมยอดรับเข้า</td>
                      <td className="border px-2 py-1">{formatMoney(summary.totalIn, "-")} บาท</td>
                    </tr>
                    <tr>
                      <td className="font-medium border px-2 py-1">รวมยอดจ่ายออก</td>
                      <td className="border px-2 py-1">{formatMoney(summary.totalOut, "-")} บาท</td>
                    </tr>
                    <tr>
                      <td className="font-medium border px-2 py-1">มูลค่าคงเหลือปลายงวด</td>
                      <td className="border px-2 py-1">{formatMoney(summary.endingValue, "-")} บาท</td>
                    </tr>
                    <tr>
                      <td className="font-medium border px-2 py-1">ราคาถัวเฉลี่ยปลายงวด</td>
                      <td className="border px-2 py-1">{formatMoney(summary.endingAvgCost, "-")} บาท/หน่วย</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
            {/* Signature section below summary, print only */}
            <div className="flex flex-wrap gap-12 mt-8 hidden print:flex">
              <div>
                <div className="mb-2">ผู้จัดทำ: ..................................</div>
                <div>วันที่: {todayStr}</div>
              </div>
              <div>
                <div className="mb-2">ผู้อนุมัติ: ..................................</div>
                <div>วันที่: {todayStr}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </PrintWrapper>
  );
}