import React, { useState } from "react";
import { formatMoney } from "./utils";
import ReceiptPreview from "./ReceiptPreview";

interface ReceiptDetailProps {
  selected: any;
  onEdit?: () => void;
  onDelete?: () => void;
}


const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ selected, onEdit, onDelete }) => {
  const [showZoom, setShowZoom] = useState(false);
  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 md:p-8 text-base border border-gray-100 dark:border-neutral-800">
      {/* File Preview */}
      <ReceiptPreview fileUrl={selected.fileUrl} fileType={selected.fileType} fileName={selected.fileName} className="mt-2 mb-6" />

      {/* Receipt Details */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">รายละเอียดใบเสร็จ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Receipt Info */}
          <div className="sm:col-span-1 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขที่ใบเสร็จ:</span>
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
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.payment_type || '-'}</span>
          </div>
          {/* Notes */}
          <div className="sm:col-span-3 flex flex-col">
            <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">หมายเหตุ:</span>
            <span className="text-gray-900 dark:text-white text-sm break-words">{selected.notes || '-'}</span>
          </div>
        </div>
      </div>
  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">อัปโหลดเมื่อ: {new Date(selected.uploadedAt).toLocaleString()}</div>

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
