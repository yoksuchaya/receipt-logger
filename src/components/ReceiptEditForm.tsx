import React, { useState } from "react";
import ReceiptPreview from "./ReceiptPreview";


export interface Product {
  name: string;
  weight: string;
  quantity: string;
  pricePerItem: string;
  price: string;
}

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
  products?: Product[];
}

interface ReceiptEditFormProps {
  editForm: ReceiptEditFormData;
  setEditForm: (form: ReceiptEditFormData) => void;
  onClose?: () => void;
  onSave?: (form: ReceiptEditFormData) => void;
}

const ReceiptEditForm: React.FC<ReceiptEditFormProps> = ({ editForm, setEditForm, onClose, onSave }) => {
  const [form, setForm] = useState<ReceiptEditFormData>(editForm);

  // Product handlers
  const handleProductChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const products = prev.products ? [...prev.products] : [];
      products[idx] = { ...products[idx], [name]: value };
      return { ...prev, products };
    });
  };

  const handleAddProduct = () => {
    setForm((prev) => ({
      ...prev,
      products: [
        ...(prev.products || []),
        { name: "", weight: "", quantity: "1", pricePerItem: "", price: "" },
      ],
    }));
  };

  const handleRemoveProduct = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      products: (prev.products || []).filter((_, i) => i !== idx),
    }));
  };

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
      {/* Products Section */}
      <div className="w-full bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 mt-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">รายการสินค้า/บริการ</span>
          <button
            type="button"
            onClick={handleAddProduct}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 dark:border-green-800 transition"
          >
            <span className="text-lg leading-none">＋</span> เพิ่มสินค้า
          </button>
        </div>
        {(!form.products || form.products.length === 0) ? (
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
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.products && form.products.map((product, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-gray-50 dark:bg-neutral-800"}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={e => handleProductChange(idx, e)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ชื่อสินค้า"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="weight"
                        value={product.weight}
                        onChange={e => handleProductChange(idx, e)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="น้ำหนัก"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="quantity"
                        value={product.quantity}
                        onChange={e => handleProductChange(idx, e)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="จำนวน"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="pricePerItem"
                        value={product.pricePerItem}
                        onChange={e => handleProductChange(idx, e)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="ราคาต่อหน่วย"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={e => handleProductChange(idx, e)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="ราคารวม"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(idx)}
                        className="px-2 py-1 rounded bg-red-50 text-red-600 font-medium text-xs hover:bg-red-100 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 dark:border-red-800 transition"
                        aria-label="ลบสินค้า"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-6">
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
