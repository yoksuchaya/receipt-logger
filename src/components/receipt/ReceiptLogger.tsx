"use client";

import React, { useRef, useState } from "react";
import ReceiptPreview from "./ReceiptPreview";
import { formatMoney } from "../utils/utils";

type PaymentMap = {
  cash?: string;
  credit_card?: string;
  transfer?: string;
};

type Product = {
  name: string;
  weight: string;
  quantity: string;
  pricePerItem: string;
  price: string;
};

type FormState = {
  date: string;
  grand_total: string;
  vat: string;
  vendor: string;
  vendor_tax_id: string;
  category: string;
  notes: string;
  payment: PaymentMap;
  receipt_no: string;
  buyer_name: string;
  buyer_address: string;
  buyer_tax_id: string;
  products: Product[];
};

type ApiResult = Record<string, unknown> | null;

type FormField = {
  name: keyof FormState;
  label: string;
  type: "text" | "date" | "number" | "textarea" | "select";
  required: boolean;
  min?: string;
  colSpan?: number;
};

type FormSection = {
  title: string;
  fields: FormField[];
  grid: string;
};

export default function ReceiptLogger() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<FormState>({
    date: "",
    grand_total: "",
    vat: "",
    vendor: "",
    vendor_tax_id: "",
    category: "",
    notes: "",
    payment: { cash: "" },
    receipt_no: "",
    buyer_name: "",
    buyer_address: "",
    buyer_tax_id: "",
    products: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiResult, setApiResult] = useState<ApiResult>(null);
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
    } catch (err) {
      if (err instanceof Error) {
        for (const [i, p] of form.products.entries()) {
          if (
            !p.name.trim() ||
            !p.weight.trim() ||
            !p.quantity.trim() ||
            !p.pricePerItem.trim() ||
            !p.price.trim()
          ) {
            setApiError(`กรุณากรอกข้อมูลสินค้าทุกช่องให้ครบ (แถวที่ ${i + 1})`);
            return;
          }
        }

        setApiError(err.message);
      } else {
        setApiError("Unknown error");
      }
      setApiReading(false);
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
        const errJson = await apiRes.json().catch(() => ({}));
        setApiError((errJson as { error?: string }).error || "API error");
      } else {
        const data = await apiRes.json();
        setApiResult(data);
        setForm((prev) => ({
          ...prev,
          date: (data.date as string) || prev.date,
          grand_total: (data.grand_total as string) || prev.grand_total,
          vat: (data.vat as string) || prev.vat,
          vendor: (data.vendor as string) || prev.vendor,
          vendor_tax_id: (data.vendor_tax_id as string) || prev.vendor_tax_id,
          category: (data.category as string) || prev.category,
          notes: (data.notes as string) || prev.notes,
          payment: {
            cash: (data.payment as { cash?: string })?.cash || "",
            credit_card: (data.payment as { credit_card?: string })?.credit_card || "",
            transfer: (data.payment as { transfer?: string })?.transfer || "",
          },
          receipt_no: (data.receipt_no as string) || prev.receipt_no,
          buyer_name: (data.buyer_name as string) || prev.buyer_name,
          buyer_address: (data.buyer_address as string) || prev.buyer_address,
          buyer_tax_id: (data.buyer_tax_id as string) || prev.buyer_tax_id,
          products: Array.isArray(data.products)
            ? (data.products as any[]).map((p: any) => ({
                name: String(p.name ?? ""),
                weight: String(p.weight ?? ""),
                quantity: String(p.quantity ?? ""),
                pricePerItem: String(p.pricePerItem ?? ""),
                price: String(p.price ?? ""),
              }))
            : prev.products,
        }));
      }
    } catch (err) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Unknown error");
      }
    } finally {
      setApiLoading(false);
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name.startsWith("payment.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, payment: { ...prev.payment, [key]: value } }));
    } else if (name.startsWith("product.")) {
      // handled in handleProductChange
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleProductChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const products = prev.products.map((p, i) =>
        i === index ? { ...p, [name]: value } : p
      );
      return { ...prev, products };
    });
  }

  function handleAddProduct() {
    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { name: "", weight: "", quantity: "1", pricePerItem: "", price: "" },
      ],
    }));
  }

  function handleRemoveProduct(index: number) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiResult(null);
    setApiError(null);
    if (!file) {
      setApiError("Please upload a receipt image.");
      return;
    }

    // Validation: sum of product prices === grand_total
    const sumProduct = form.products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const grandTotal = parseFloat(form.grand_total) || 0;
    if (form.products.length > 0 && Math.abs(sumProduct - grandTotal) > 0.01) {
      setApiError("ผลรวมราคารวมของสินค้าทั้งหมดไม่ตรงกับยอดรวมทั้งสิ้น");
      return;
    }

    // Validation: sum of payment types === grand_total
    const sumPayment = (["cash", "credit_card", "transfer"] as (keyof PaymentMap)[]).reduce(
      (sum, type) => sum + (parseFloat(form.payment[type] || "0") || 0),
      0
    );
    if (Math.abs(sumPayment - grandTotal) > 0.01) {
      setApiError("ผลรวมช่องทางการชำระเงินไม่ตรงกับยอดรวมทั้งสิ้น");
      return;
    }

    const uploadLog = { ...form, payment: { ...form.payment }, products: form.products };
    const formData = new FormData();
    Object.entries(uploadLog).forEach(([key, value]) => {
      if (key === "payment" || key === "products") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value as string);
      }
    });
    formData.append("file", file);
    try {
      await fetch("/api/receipt-log", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to log receipt upload:", err);
    }
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
      payment: { cash: "" },
      receipt_no: "",
      buyer_name: "",
      buyer_address: "",
      buyer_tax_id: "",
      products: [],
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const formSections: FormSection[] = [
    {
      title: "ข้อมูลใบเสร็จ",
      fields: [
        { name: "receipt_no", label: "เลขที่ใบเสร็จ", type: "text", required: false },
        { name: "date", label: "วันที่", type: "date", required: true },
        { name: "category", label: "ประเภทสินค้า/บริการ", type: "text", required: false },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2",
    },
    {
      title: "ผู้ขาย",
      fields: [
        { name: "vendor", label: "ชื่อผู้ขาย", type: "text", required: false },
        { name: "vendor_tax_id", label: "เลขประจำตัวผู้เสียภาษีผู้ขาย", type: "text", required: false },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2",
    },
    {
      title: "ผู้ซื้อ",
      fields: [
        { name: "buyer_name", label: "ชื่อผู้ซื้อ (ถ้ามี)", type: "text", required: false },
        { name: "buyer_address", label: "ที่อยู่ผู้ซื้อ (ถ้ามี)", type: "text", required: false },
        { name: "buyer_tax_id", label: "เลขประจำตัวผู้เสียภาษีผู้ซื้อ (ถ้ามี)", type: "text", colSpan: 3, required: false },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2",
    },
    {
      title: "ยอดรวมและการชำระเงิน",
      fields: [
        { name: "grand_total", label: "ยอดรวมทั้งสิ้น", type: "number", required: true, min: "0" },
        { name: "vat", label: "ภาษีมูลค่าเพิ่ม (VAT)", type: "number", required: true, min: "0" },
      ],
      grid: "grid-cols-1 sm:grid-cols-3 sm:grid-cols-2",
    },
    {
      title: "หมายเหตุ",
      fields: [
        { name: "notes", label: "หมายเหตุ", type: "textarea", colSpan: 2, required: false },
      ],
      grid: "sm:col-span-2",
    },
  ];

  return (
    <div className="w-full relative">
      {(apiLoading || apiReading) && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div className="text-blue-700 dark:text-blue-200 font-semibold text-lg drop-shadow">
            {apiLoading ? "Processing receipt..." : "Loading preview..."}
          </div>
        </div>
      )}
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Upload */}
        <div>
          <label className="block font-medium mb-2 text-gray-800 dark:text-gray-100">รูปถ่ายใบเสร็จ</label>
          <label
            htmlFor="receipt-photo-input"
            className="inline-block cursor-pointer px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 border border-blue-200 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
          >
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
                  className={`flex-1 py-2 rounded-lg font-semibold text-base shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                    apiResult
                      ? "bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-600"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!apiResult}
                >
                  ดูข้อมูล JSON ดิบ
                </button>
              </div>
            </>
          )}
        </div>
        {/* Error + JSON Preview */}
        <div className="mb-4">
          {apiError && <div className="text-red-600 font-medium">{apiError}</div>}
          {showPreview && apiResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowPreview(false)}>
              <div className="absolute top-4 right-4">
                <button
                  className="text-white bg-black bg-opacity-80 rounded-full p-3 shadow-lg hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>
              <div className="relative max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
                <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-4 text-xs overflow-x-auto text-gray-800 dark:text-gray-100 max-h-[80vh] max-w-[90vw]">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        {/* Form Sections */}
        {formSections.map((section, i) => (
          <div key={section.title + i} className={section.grid.includes("grid") ? `grid ${section.grid} gap-4` : section.grid}>
            {section.fields.map((field, j) => {
              const colSpan = field.colSpan ? `sm:col-span-${field.colSpan}` : "";
              return (
                <div key={field.name + j} className={colSpan}>
                  <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor={field.name}>
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={form[field.name] as string}
                      onChange={handleFormChange}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : field.name === "grand_total" || field.name === "vat" ? (
                    <input
                      id={field.name}
                      name={field.name}
                      value={form[field.name] as string}
                      onChange={handleFormChange}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="number"
                      min={field.min}
                      step="any"
                      inputMode="decimal"
                      style={{ MozAppearance: 'textfield' }}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      value={form[field.name] as string}
                      onChange={handleFormChange}
                      required={field.required}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type={field.type}
                      min={field.min}
                    />
                  )}
                </div>
              );
            })}
            {/* Payment type multi-input */}
            {section.title === "ยอดรวมและการชำระเงิน" && (
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {(["cash", "credit_card", "transfer"] as const).map((type) => (
                  <div key={type}>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor={`payment.${type}`}>
                      {type === "cash" ? "เงินสด" : type === "credit_card" ? "บัตรเครดิต" : "โอนเงิน"}
                    </label>
                    <input
                      id={`payment.${type}`}
                      name={`payment.${type}`}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      style={{ MozAppearance: 'textfield' }}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                      className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.payment[type] || ""}
                      onChange={handleFormChange}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Products Section - Consistent UI */}
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
          <div className="grid grid-cols-1 gap-4">
            {form.products.length === 0 && (
              <div className="text-center text-gray-400 py-4 text-sm">ไม่มีสินค้า</div>
            )}
            {form.products.map((product, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 border border-gray-100 dark:border-neutral-800 relative">
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={`product-name-${idx}`}>ชื่อสินค้า</label>
                  <input
                    id={`product-name-${idx}`}
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={e => handleProductChange(idx, e)}
                    className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อสินค้า"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={`product-weight-${idx}`}>น้ำหนัก</label>
                  <input
                    id={`product-weight-${idx}`}
                    type="number"
                    name="weight"
                    value={product.weight}
                    onChange={e => handleProductChange(idx, e)}
                    className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="น้ำหนัก"
                    min="0"
                    step="any"
                    inputMode="decimal"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={`product-quantity-${idx}`}>จำนวน</label>
                  <input
                    id={`product-quantity-${idx}`}
                    type="number"
                    name="quantity"
                    value={product.quantity}
                    onChange={e => handleProductChange(idx, e)}
                    className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="จำนวน"
                    min="1"
                    step="1"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={`product-pricePerItem-${idx}`}>ราคาต่อหน่วย</label>
                  <input
                    id={`product-pricePerItem-${idx}`}
                    type="number"
                    name="pricePerItem"
                    value={product.pricePerItem}
                    onChange={e => handleProductChange(idx, e)}
                    className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ราคาต่อหน่วย"
                    min="0"
                    step="any"
                    inputMode="decimal"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor={`product-price-${idx}`}>ราคารวม</label>
                  <input
                    id={`product-price-${idx}`}
                    type="number"
                    name="price"
                    value={product.price}
                    onChange={e => handleProductChange(idx, e)}
                    className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ราคารวม"
                    min="0"
                    step="any"
                    inputMode="decimal"
                  />
                </div>
                <div className="flex flex-col items-center justify-end h-full">
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(idx)}
                    className="mt-5 sm:mt-0 px-3 py-2 rounded-lg bg-red-50 text-red-600 font-medium text-xs hover:bg-red-100 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 dark:border-red-800 transition"
                    aria-label="ลบสินค้า"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
