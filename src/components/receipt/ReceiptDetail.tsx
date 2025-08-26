import React, { useState, useEffect } from "react";
import { formatMoney } from "../utils/utils";
import ReceiptPreview from "./ReceiptPreview";

interface PaymentType {
  value: string;
  label: string;
}

interface Product {
  name: string;
  weight: string;
  quantity: string;
  pricePerItem: string;
  price: string;
}

interface PaymentMap {
  [key: string]: string | number | undefined;
}

interface ReceiptDetailData {
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  receipt_no?: string;
  date?: string;
  category?: string;
  vendor?: string;
  vendor_tax_id?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_tax_id?: string;
  grand_total?: number | string;
  vat?: number | string;
  payment_type?: string;
  payment?: PaymentMap;
  notes?: string;
  uploadedAt?: string;
  products?: Product[];
  systemGenerated?: boolean;
}

interface ReceiptDetailProps {
  selected: ReceiptDetailData;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ selected, onEdit, onDelete }) => {
  // const [showZoom, setShowZoom] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/company-profile');
      const data = await res.json();
      setCompanyProfile(data);
    }
    fetchProfile();
  }, []);
  
  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 md:p-8 text-base border border-gray-100 dark:border-neutral-800">
      {/* File Preview */}
      <ReceiptPreview
        fileUrl={selected.fileUrl ?? ''}
        fileType={selected.fileType ?? ''}
        fileName={selected.fileName ?? ''}
        className="mt-2 mb-6"
        systemGenerated={selected.systemGenerated}
        receiptData={selected}
      />

      {/* Receipt Details */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">รายละเอียดเอกสาร</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Receipt Info */}
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขที่เอกสาร:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.receipt_no || '-'}</span>
          </div>
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">วันที่:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.date || '-'}</span>
          </div>
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ประเภทสินค้า/บริการ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.category || '-'}</span>
          </div>
          {/* Vendor Info */}
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ชื่อผู้ขาย:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.vendor || '-'}</span>
          </div>
          <div className="sm:col-span-2 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขประจำตัวผู้เสียภาษีผู้ขาย:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.vendor_tax_id || '-'}</span>
          </div>
          {/* Buyer Info */}
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ชื่อผู้ซื้อ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.buyer_name || '-'}</span>
          </div>
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ที่อยู่ผู้ซื้อ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.buyer_address || '-'}</span>
          </div>
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขประจำตัวผู้เสียภาษีผู้ซื้อ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.buyer_tax_id || '-'}</span>
          </div>
          {/* Totals & Payment */}
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ยอดรวมทั้งสิ้น:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{formatMoney(selected.grand_total)}</span>
          </div>
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ภาษีมูลค่าเพิ่ม (VAT):</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{formatMoney(selected.vat)}</span>
          </div>

          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">วิธีการชำระเงิน:</span>
            {selected.payment && typeof selected.payment === 'object' ? (
              <div className="flex flex-col gap-0.5">
                {companyProfile?.paymentTypes?.map((type: PaymentType) => {
                  const value = selected.payment ? selected.payment[type.value] : undefined;
                  if (!value || value === '0' || value === 0) return null;
                  return (
                    <span key={type.value} className="text-gray-900 dark:text-white text-sm break-words">
                      {type.label}: {formatMoney(value)}
                    </span>
                  );
                })}
                {/* If no payment types are filled, show dash */}
                {companyProfile?.paymentTypes?.every((type: PaymentType) => !selected.payment || !selected.payment[type.value] || selected.payment[type.value] === '0' || selected.payment[type.value] === 0) && (
                  <span className="text-gray-900 dark:text-white text-sm break-words">-</span>
                )}
              </div>
            ) : (
              <span className="text-gray-900 dark:text-white text-sm break-words">{selected.payment_type || '-'}</span>
            )}
          </div>
          {/* Notes */}
          <div className="sm:col-span-3 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">หมายเหตุ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.notes || '-'}</span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="w-full bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 mt-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">รายการสินค้า/บริการ</span>
        </div>
        {(!selected.products || selected.products.length === 0) ? (
          <div className="text-center text-gray-400 py-4 text-sm">ไม่มีสินค้า</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700 text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800">
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ชื่อสินค้า</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">น้ำหนัก</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">จำนวน</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ราคาต่อหน่วย</th>
                  <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ราคารวม</th>
                </tr>
              </thead>
              <tbody>
                {selected.products.map((product, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-gray-50 dark:bg-neutral-800"}>
                    <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{product.name || '-'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{product.weight || '-'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{product.quantity || '-'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(product.pricePerItem) || '-'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(product.price) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
        อัปโหลดเมื่อ: {selected.uploadedAt ? new Date(selected.uploadedAt).toLocaleString() : "-"}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            แก้ไข
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          >
            ลบ
          </button>
        )}
      </div>
    </div>
  );
};

export default ReceiptDetail;
