"use client";

import React, { useRef, useState } from "react";
import ReceiptPreview from "./ReceiptPreview";
import { formatMoney } from "./utils";

export default function ReceiptLogger() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    date: "",
    grand_total: "",
    vat: "",
    vendor: "",
    vendor_tax_id: "",
    category: "",
    notes: "",
    payment_type: "cash",
    receipt_no: "",
    buyer_name: "",
    buyer_address: "",
    buyer_tax_id: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiResult, setApiResult] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiReading, setApiReading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Just preview the original image, do not scan
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;
    const isImage = fileObj.type.startsWith("image/");
    const isPdf = fileObj.type === "application/pdf";
    if (!isImage && !isPdf) {
      setApiError("Please upload an image file (JPG, PNG, etc.) or PDF file.");
      setFile(null);
      setImage(null);
      return;
    }
    // Validate file size (e.g., at least 20KB)
    if (fileObj.size < 20 * 1024) {
      setApiError("The selected file is too small to be a valid receipt. Please upload a clearer file.");
      setFile(null);
      setImage(null);
      return;
    }
    setFile(fileObj);
    setApiResult(null);
    setApiError(null);
    setApiReading(true);
    if (isImage || isPdf) {
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImage(ev.target?.result as string);
          setApiReading(false);
        };
        reader.onerror = () => {
          setApiError("Failed to load file");
          setApiReading(false);
        };
        reader.readAsDataURL(fileObj);
      } catch (err: any) {
        setApiError(err.message || "Unknown error");
        setApiReading(false);
      }
    }
  }

  // Call API to read receipt for both images and PDFs
  async function handleReadReceipt() {
    setApiResult(null);
    setApiError(null);
    if (!file) {
      setApiError("Please upload a receipt file first.");
      return;
    }
    setApiLoading(true);
    try {
      let origFile = file;
      // If image, reconstruct File from dataURL to preserve edits (if any)
      if (image && file.type.startsWith("image/")) {
        const res = await fetch(image);
        const blob = await res.blob();
        origFile = new File([blob], file.name, { type: file.type });
      }
      const formData = new FormData();
      formData.append("file", origFile);
      const apiRes = await fetch("/api/receipt", {
        method: "POST",
        body: formData,
      });
      if (!apiRes.ok) {
        const err = await apiRes.json();
        setApiError(err.error || "API error");
      } else {
        const data = await apiRes.json();
        setApiResult(data);
        // Auto-fill form fields if keys exist in response
        setForm((prev) => ({
          ...prev,
          date: data.date || prev.date,
          grand_total: data.grand_total || prev.grand_total,
          vat: data.vat || prev.vat,
          vendor: data.vendor || prev.vendor,
          vendor_tax_id: data.vendor_tax_id || prev.vendor_tax_id,
          category: data.category || prev.category,
          notes: data.notes || prev.notes,
          payment_type: (data.payment?.cash > 0) ? "cash" : (data.payment?.transfer > 0 ? "transfer" : prev.payment_type),
          receipt_no: data.receipt_no || prev.receipt_no,
          buyer_name: data.buyer_name || prev.buyer_name,
          buyer_address: data.buyer_address || prev.buyer_address,
          buyer_tax_id: data.buyer_tax_id || prev.buyer_tax_id,
        }));
      }
    } catch (err: any) {
      setApiError(err.message || "Unknown error");
    } finally {
      setApiLoading(false);
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiResult(null);
    setApiError(null);
    if (!file) {
      setApiError("Please upload a receipt image.");
      return;
    }
    // Log the JSON object for this receipt upload (for reporting)
    const uploadLog = {
      ...form,
    };
    const formData = new FormData();
    Object.entries(uploadLog).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);
    try {
      await fetch('/api/receipt-log', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      // Optionally handle error
      console.error('Failed to log receipt upload:', err);
    }
    // No API call here, just handle form submission logic if needed
    // Reset form after logging
    setImage(null);
    setFile(null);
    setForm({
      date: "",
      grand_total: "",
      vat: "",
      vendor: "",
      vendor_tax_id: "",
      category: "",
      notes: "",
      payment_type: "cash",
      receipt_no: "",
      buyer_name: "",
      buyer_address: "",
      buyer_tax_id: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // DRY: Define form fields with section info
  const formSections = [
    {
      title: "ข้อมูลใบเสร็จ",
      fields: [
        { name: "receipt_no", label: "เลขที่ใบเสร็จ", type: "text", required: false, step: undefined, min: undefined },
        { name: "date", label: "วันที่", type: "date", required: true, step: undefined, min: undefined },
        { name: "category", label: "ประเภทสินค้า/บริการ", type: "text", required: false, step: undefined, min: undefined },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2"
    },
    {
      title: "ผู้ขาย",
      fields: [
        { name: "vendor", label: "ชื่อผู้ขาย", type: "text", required: false, step: undefined, min: undefined },
        { name: "vendor_tax_id", label: "เลขประจำตัวผู้เสียภาษีผู้ขาย", type: "text", required: false, step: undefined, min: undefined },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2"
    },
    {
      title: "ผู้ซื้อ",
      fields: [
        { name: "buyer_name", label: "ชื่อผู้ซื้อ (ถ้ามี)", type: "text", required: false, step: undefined, min: undefined },
        { name: "buyer_address", label: "ที่อยู่ผู้ซื้อ (ถ้ามี)", type: "text", required: false, step: undefined, min: undefined },
        { name: "buyer_tax_id", label: "เลขประจำตัวผู้เสียภาษีผู้ซื้อ (ถ้ามี)", type: "text", colSpan: 3, required: false, step: undefined, min: undefined },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2"
    },
    {
      title: "ยอดรวมและการชำระเงิน",
      fields: [
        { name: "grand_total", label: "ยอดรวมทั้งสิ้น", type: "number", required: true, step: "0.01", min: "0" },
        { name: "vat", label: "ภาษีมูลค่าเพิ่ม (VAT)", type: "number", required: true, step: "0.01", min: "0" },
        { name: "payment_type", label: "วิธีการชำระเงิน", type: "select", colSpan: 3, required: true, step: undefined, min: undefined },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2"
    },
    {
      title: "หมายเหตุ",
      fields: [
        { name: "notes", label: "หมายเหตุ", type: "textarea", colSpan: 2, required: false, step: undefined, min: undefined },
      ],
      grid: "sm:col-span-2"
    },
  ];

  return (
    <div className="w-full relative">
      {/* Loading Overlay */}
      {(apiLoading || apiReading) && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div className="text-blue-700 dark:text-blue-200 font-semibold text-lg drop-shadow">{apiLoading ? 'Processing receipt...' : 'Loading preview...'}</div>
        </div>
      )}
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Receipt Photo Upload */}
        <div>
          <label className="block font-medium mb-2 text-gray-800 dark:text-gray-100">รูปถ่ายใบเสร็จ</label>
          <label htmlFor="receipt-photo-input" className="inline-block cursor-pointer px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 border border-blue-200 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition">
            ถ่ายรูป / เลือกไฟล์
          </label>
          <input
            id="receipt-photo-input"
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleImageChange}
            className="hidden"
          />
          {image && file && (
            <>
              <ReceiptPreview fileUrl={image} fileType={file.type} fileName={file.name} />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleReadReceipt}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-semibold text-base shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={apiReading || apiLoading}
                >
                  {apiLoading ? "กำลังอ่าน..." : "อ่านข้อมูลใบเสร็จ"}
                </button>
                <button
                  type="button"
                  onClick={() => apiResult && setShowPreview(true)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-base shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${apiResult ? 'bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-600' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 cursor-not-allowed'}`}
                  disabled={!apiResult}
                >
                  ดูข้อมูล JSON ดิบ
                </button>
              </div>
            </>
          )}
        </div>
        {/* API/Result/Loading/Error */}
        <div className="mb-4">
          {/* Error and JSON Modal */}
          {apiError && <div className="text-red-600 font-medium">{apiError}</div>}
          {showPreview && apiResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowPreview(false)}>
              <div className="absolute top-4 right-4">
                <button
                  className="text-white bg-black bg-opacity-80 rounded-full p-3 shadow-lg hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close preview"
                  style={{ fontSize: 0 }}
                >
                  ×
                </button>
              </div>
              <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
                <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-4 text-xs overflow-x-auto text-gray-800 dark:text-gray-100 max-h-[80vh] max-w-[90vw]">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        {/* Form Sections */}
        {formSections.map((section, i) => (
          <div key={section.title + i} className={section.grid.includes('grid') ? `grid ${section.grid} gap-4` : section.grid}>
            {section.fields.map((field, j) => {
              const colSpan = field.colSpan ? `sm:col-span-${field.colSpan}` : '';
              return (
                <div key={field.name + j} className={colSpan}>
                  <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor={field.name}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleFormChange}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={form[field.name as keyof typeof form]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, payment_type: e.target.value })}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="transfer/credit/check">โอน/บัตรเครดิต/เช็ค</option>
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      value={(field.name === 'grand_total' || field.name === 'vat') ? formatMoney(form[field.name as keyof typeof form]) : form[field.name as keyof typeof form]}
                      onChange={handleFormChange}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type={field.type}
                      step={field.step}
                      min={field.min}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <button
          type="submit"
          className="mt-4 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          บันทึกใบเสร็จ
        </button>
      </form>
    </div>
  );
}
