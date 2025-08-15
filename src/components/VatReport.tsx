

import { useState, useEffect } from "react";
import { formatMoney } from "./utils";
import VatBreadcrumb from "./VatBreadcrumb";
import VatReportHeader from "./VatReportHeader";
import VatSaleReportTable from "./VatSaleReportTable";
import VatPurchaseReportTable from "./VatPurchaseReportTable";

export default function VatReport() {
  const [selected, setSelected] = useState<'purchase' | 'sale' | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("06");
  const [year, setYear] = useState("2025");
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
    if (selected === 'sale') {
      setLoading(true);
      setError("");
      fetch(`/api/vat-sale-report?month=${month}&year=${year}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setSalesData(data.sales || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
          setLoading(false);
        });
    } else if (selected === 'purchase') {
      setLoading(true);
      setError("");
      fetch(`/api/vat-purchase-report?month=${month}&year=${year}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setPurchaseData(data.purchases || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
          setLoading(false);
        });
    }
  }, [selected, month, year]);

  // --- Sale report sums ---
  const filtered = salesData;
  const sumExVat = filtered.reduce((sum, r) => sum + (Number(r.grand_total) - Number(r.vat)), 0);
  const sumVat = filtered.reduce((sum, r) => sum + Number(r.vat), 0);
  const sumTotal = filtered.reduce((sum, r) => sum + Number(r.grand_total), 0);

  // --- Purchase report sums ---
  const filteredPurchase = purchaseData;
  const sumAmount = filteredPurchase.reduce((sum, r) => sum + (Number(r.grand_total) - Number(r.vat)), 0);
  const sumVatPurchase = filteredPurchase.reduce((sum, r) => sum + Number(r.vat), 0);
  const sumTotalPurchase = filteredPurchase.reduce((sum, r) => sum + Number(r.grand_total), 0);

  // --- Main render ---
  if (selected === 'sale') {
    return (
      <div className="w-full max-w-full">
        <VatBreadcrumb type="sale" onBack={() => setSelected(null)} />
        <h2 className="text-xl font-bold mb-4">รายงานภาษีขาย</h2>
        <div className="mt-8 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-700 shadow w-full max-w-full">
          <div className="w-full">
            <VatReportHeader
              month={month}
              year={year}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
              onMonthChange={setMonth}
              onYearChange={setYear}
            />
          </div>
          <div className="w-full max-w-full overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 min-w-[400px]">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8 min-w-[400px]">{error}</div>
            ) : (
              <VatSaleReportTable
                data={filtered}
                sumExVat={sumExVat}
                sumVat={sumVat}
                sumTotal={sumTotal}
              />
            )}
          </div>
          <div className="mt-8 flex flex-col gap-2 text-sm">
            <div>ผู้จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
            <div>วันที่จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (selected === 'purchase') {
    const company = {
      name: "ชื่อบริษัท",
      address: "[ที่อยู่บริษัท]",
      taxId: "[เลขผู้เสียภาษี]"
    };
    const monthLabel = monthOptions.find((m) => m.value === month)?.label || month;
    const today = new Date();
    const printDate = today.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    return (
      <div className="w-full max-w-full">
        <VatBreadcrumb type="purchase" onBack={() => setSelected(null)} />
        <h2 className="text-xl font-bold mb-4">รายงานภาษีซื้อ</h2>
        <div className="mt-8 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-700 shadow w-full max-w-full">
          <div className="w-full">
            <VatReportHeader
              month={month}
              year={year}
              monthOptions={monthOptions}
              yearOptions={yearOptions}
              onMonthChange={setMonth}
              onYearChange={setYear}
              // @ts-ignore
              title="รายงานภาษีซื้อ"
            />
          </div>
          {/* Table */}
          <div className="w-full max-w-full overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 min-w-[400px]">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8 min-w-[400px]">{error}</div>
            ) : (
              <VatPurchaseReportTable
                data={filteredPurchase}
                sumAmount={sumAmount}
                sumVat={sumVatPurchase}
                sumTotal={sumTotalPurchase}
              />
            )}
          </div>
          <div className="mt-8 flex flex-col gap-2 text-sm">
            <div>ผู้จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
            <div>วันที่จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Menu selection
  return (
    <div className="w-full">
      <ul className="space-y-4 mb-4">
        <li>
          <button
            className="block w-full text-left p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-lg border border-blue-200 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
            onClick={() => setSelected('purchase')}
          >
            รายงานภาษีซื้อ
          </button>
        </li>
        <li>
          <button
            className="block w-full text-left p-4 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-lg border border-green-200 dark:bg-neutral-800 dark:text-green-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
            onClick={() => setSelected('sale')}
          >
            รายงานภาษีขาย
          </button>
        </li>
      </ul>
    </div>
  );
}
