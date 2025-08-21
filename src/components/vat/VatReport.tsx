

import { useState, useEffect } from "react";
import VatBreadcrumb from "./VatBreadcrumb";
import VatReportHeader from "./VatReportHeader";
import VatSaleReportTable from "./VatSaleReportTable";
import VatPurchaseReportTable from "./VatPurchaseReportTable";
import ReceiptDetail from "../receipt/ReceiptDetail";
import ReceiptEditForm, { type ReceiptEditFormData } from "../receipt/ReceiptEditForm";
import ReceiptBreadcrumb from "../receipt/ReceiptBreadcrumb";
import PrintWrapper from "../layout/PrintWrapper";

export default function VatReport() {
  const [selected, setSelected] = useState<'purchase' | 'sale' | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [edit, setEdit] = useState(false);
  const [editForm, setEditForm] = useState<ReceiptEditFormData>({} as ReceiptEditFormData);
  interface VatSale {
    date: string;
    receipt_no: string;
    buyer_name: string;
    buyer_tax_id: string;
    buyer_address: string;
    grand_total: number;
    vat: number;
    notes?: string;
  }
  interface VatPurchase {
    date: string;
    receipt_no: string;
    vendor: string;
    vendor_tax_id: string;
    description: string;
    grand_total: number;
    vat: number;
    category: string;
    notes?: string;
  }
  const [salesData, setSalesData] = useState<VatSale[]>([]);
  const [purchaseData, setPurchaseData] = useState<VatPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Set initial month and year to current month and year
  const now = new Date();
  const initialMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const initialYear = now.getFullYear().toString();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  // Month/year options are now handled by VatReportHeader

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


  if (selected === 'sale') {
    if (selectedRow) {
      return (
        <div className="w-full max-w-full">
          <VatBreadcrumb
            type={selected}
            edit={edit}
            onBack={() => { setSelectedRow(null); setEdit(false); }}
            onRoot={() => {
              setEdit(false);
              setSelectedRow(null);
              setEditForm({} as ReceiptEditFormData);
              setSelected(null);
            }}
          />
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full">
            {edit ? (
              <ReceiptEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={async () => {
                  setSelectedRow(null);
                  setEdit(false);
                }}
                onClose={() => { setSelectedRow(null); setEdit(false); }}
              />
            ) : (
              <ReceiptDetail
                selected={selectedRow}
                onEdit={() => { setEdit(true); setEditForm(selectedRow); }}
                onDelete={async () => {
                  if (window.confirm('Delete this receipt?')) {
                    setSelectedRow(null);
                    setEdit(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-full">
        <VatBreadcrumb
          type="sale"
          onBack={() => setSelected(null)}
          onRoot={() => {
            setEdit(false);
            setSelectedRow(null);
            setEditForm({} as ReceiptEditFormData);
            setSelected(null);
          }}
        />
        <h2 className="text-xl font-bold mb-4">รายงานภาษีขาย</h2>
        <PrintWrapper printLabel="รายงานภาษีขาย" printButtonLabel="พิมพ์รายงานภาษีขาย">
          <div className="mt-8 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-700 shadow w-full max-w-full">
            <div className="w-full vat-header">
              <VatReportHeader
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
                title="รายงานภาษีขาย"
              />
            </div>
            <div className="w-full max-w-full overflow-x-auto vat-table">
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
                  onRowAction={(row, isEdit) => {
                    setSelectedRow(row);
                    setEdit(!!isEdit);
                    setEditForm(row);
                  }}
                />
              )}
            </div>
            <div className="mt-8 flex flex-col gap-2 text-sm vat-signature">
              <div className="print:block hidden mt-8 flex flex-col gap-2 text-sm vat-signature">
                <div>ผู้จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
                <div>วันที่จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
              </div>
            </div>
          </div>
        </PrintWrapper>
      </div>
    );
  }

  if (selected === 'purchase') {
    if (selectedRow) {
      return (
        <div className="w-full max-w-full">
          <VatBreadcrumb
            type={selected}
            edit={edit}
            onBack={() => { setSelectedRow(null); setEdit(false); }}
            onRoot={() => { setSelected(null); setSelectedRow(null); setEdit(false); }}
          />
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full">
            {edit ? (
              <ReceiptEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={async () => {
                  setSelectedRow(null);
                  setEdit(false);
                }}
                onClose={() => { setSelectedRow(null); setEdit(false); }}
              />
            ) : (
              <ReceiptDetail
                selected={selectedRow}
                onEdit={() => { setEdit(true); setEditForm(selectedRow); }}
                onDelete={async () => {
                  if (window.confirm('Delete this receipt?')) {
                    setSelectedRow(null);
                    setEdit(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      );
    }
  // const company = {
  //   name: "ชื่อบริษัท",
  //   address: "[ที่อยู่บริษัท]",
  //   taxId: "[เลขผู้เสียภาษี]"
  // };
  // const monthLabel = monthOptions.find((m) => m.value === month)?.label || month;
  // const today = new Date();
  // const printDate = today.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    return (
      <div className="w-full max-w-full">
        <VatBreadcrumb
          type="purchase"
          onBack={() => setSelected(null)}
          onRoot={() => {
            setEdit(false);
            setSelectedRow(null);
            setEditForm({} as ReceiptEditFormData);
            setSelected(null);
          }}
        />
        <h2 className="text-xl font-bold mb-4">รายงานภาษีซื้อ</h2>
        <PrintWrapper printLabel="รายงานภาษีซื้อ" printButtonLabel="พิมพ์รายงานภาษีซื้อ">
          <div className="mt-8 bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-neutral-700 shadow w-full max-w-full">
            <div className="w-full vat-header">
              <VatReportHeader
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
                title="รายงานภาษีซื้อ"
              />
            </div>
            {/* Table */}
            <div className="w-full max-w-full overflow-x-auto vat-table">
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
                  onRowAction={(row, isEdit) => {
                    setSelectedRow(row);
                    setEdit(!!isEdit);
                    setEditForm(row);
                  }}
                />
              )}
            </div>
            <div className="mt-8 flex flex-col gap-2 text-sm vat-signature">
              <div className="print:block hidden mt-8 flex flex-col gap-2 text-sm vat-signature">
                <div>ผู้จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
                <div>วันที่จัดทำ <span className="inline-block min-w-[120px] border-b border-dashed border-gray-400 align-middle">&nbsp;</span></div>
              </div>
            </div>
          </div>
        </PrintWrapper>
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
