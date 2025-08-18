import React, { useState } from "react";
import ReceiptPreview from "./ReceiptPreview";


export interface ReceiptEditFormData {
  image_path?: string;
  fileUrl?: string;
  image_type?: string;
  fileType?: string;
  image_name?: string;
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
  notes?: string;
}

interface ReceiptEditFormProps {
  editForm: ReceiptEditFormData;
  setEditForm: (form: ReceiptEditFormData) => void;
  onClose?: () => void;
  onSave?: (form: ReceiptEditFormData) => void;
}

const ReceiptEditForm: React.FC<ReceiptEditFormProps> = ({ editForm, setEditForm, onClose, onSave }) => {
  const [form, setForm] = useState<ReceiptEditFormData>(editForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setEditForm(form);
    if (onSave) await onSave(form);
    if (onClose) onClose();
  };

  return (
    <>
      {(form.image_path || form.fileUrl || editForm.image_path || editForm.fileUrl) && (
        <div className="mb-4 flex justify-center">
          <ReceiptPreview
            fileUrl={form.image_path || form.fileUrl || editForm.image_path || editForm.fileUrl || ''}
            fileType={form.image_type || form.fileType || editForm.image_type || editForm.fileType || 'image/png'}
            fileName={form.image_name || form.fileName || editForm.image_name || editForm.fileName || ''}
            className="mt-2 mb-6"
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receipt Info */}
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขที่ใบเสร็จ</label>
          <input
            type="text"
            name="receipt_no"
            value={form.receipt_no}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">วันที่</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ประเภทสินค้า/บริการ</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {/* Vendor Info */}
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ชื่อผู้ขาย</label>
          <input
            type="text"
            name="vendor"
            value={form.vendor}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-2 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขประจำตัวผู้เสียภาษีผู้ขาย</label>
          <input
            type="text"
            name="vendor_tax_id"
            value={form.vendor_tax_id}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {/* Buyer Info */}
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ชื่อผู้ซื้อ</label>
          <input
            type="text"
            name="buyer_name"
            value={form.buyer_name}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ที่อยู่ผู้ซื้อ</label>
          <input
            type="text"
            name="buyer_address"
            value={form.buyer_address}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขประจำตัวผู้เสียภาษีผู้ซื้อ</label>
          <input
            type="text"
            name="buyer_tax_id"
            value={form.buyer_tax_id}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {/* Totals & Payment */}
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ยอดรวมทั้งสิ้น</label>
          <input
            type="number"
            name="grand_total"
            value={form.grand_total}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ภาษีมูลค่าเพิ่ม (VAT)</label>
          <input
            type="number"
            name="vat"
            value={form.vat}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="sm:col-span-1 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">วิธีการชำระเงิน</label>
          <input
            type="text"
            name="payment_type"
            value={form.payment_type}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        {/* Notes */}
        <div className="sm:col-span-3 flex flex-col">
          <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">หมายเหตุ</label>
          <input
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          บันทึก
        </button>
        {onClose && (
          <button
            type="button"
            className="rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={onClose}
          >
            ยกเลิก
          </button>
        )}
      </div>
    </form>
    </>
  );
};

export default ReceiptEditForm;
