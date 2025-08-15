"use client";

import React, { useRef, useState } from "react";


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
    // Validate file type (allow only image/*)
    const isImage = fileObj.type.startsWith("image/");
    if (!isImage) {
      setApiError("Please upload an image file (JPG, PNG, etc.)");
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
        setApiError("Failed to load image");
        setApiReading(false);
      };
      reader.readAsDataURL(fileObj);
    } catch (err: any) {
      setApiError(err.message || "Unknown error");
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
    // No API call here, just handle form submission logic if needed
    // Optionally reset form
    // setImage(null);
    // setFile(null);
    // setForm({ date: "", grand_total: "", vat: "", vendor: "", category: "", notes: "", payment_type: "cash" });
    // if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Helper type for form fields
  const formFields = [
    { name: "receipt_no", label: "Receipt No.", type: "text", required: false },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "category", label: "Category", type: "text", required: false },
    { name: "vendor", label: "Vendor", type: "text", required: false },
    { name: "vendor_tax_id", label: "Vendor Tax Payer ID", type: "text", required: false },
    { name: "buyer_name", label: "Buyer Name (optional)", type: "text", required: false },
    { name: "buyer_address", label: "Buyer Address (optional)", type: "text", required: false },
    { name: "buyer_tax_id", label: "Buyer Tax Payer ID (optional)", type: "text", required: false },
    { name: "grand_total", label: "Grand Total", type: "number", required: true, step: "0.01", min: "0" },
    { name: "vat", label: "VAT", type: "number", required: true, step: "0.01", min: "0" },
    { name: "notes", label: "Notes", type: "textarea", required: false },
  ];

  return (
    <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium mb-2 text-gray-800 dark:text-gray-100">Receipt Photo</label>
        <label htmlFor="receipt-photo-input" className="inline-block cursor-pointer px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 border border-blue-200 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition">
          Take Photo / Choose File
        </label>
        <input
          id="receipt-photo-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {image && (
          <>
            <img
              src={image}
              alt="Receipt preview"
              className="mt-4 rounded-lg max-h-48 object-contain border border-gray-200 dark:border-neutral-700 mx-auto"
              onClick={() => setShowPreview(true)}
              style={{ cursor: 'pointer' }}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 font-semibold text-base shadow hover:bg-gray-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleReadReceipt}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-semibold text-base shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                disabled={apiReading || apiLoading}
              >
                {apiLoading ? "Reading..." : "Read Receipt"}
              </button>
            </div>
            {/* Modal for big image preview */}
            {showPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowPreview(false)}>
                <div className="absolute top-4 right-4">
                  <button
                    className="text-white bg-black bg-opacity-80 rounded-full p-3 shadow-lg hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setShowPreview(false)}
                    aria-label="Close preview"
                    style={{ fontSize: 0 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
                  <img
                    src={image}
                    alt="Receipt large preview"
                    className="rounded-lg max-h-[80vh] max-w-[90vw] object-contain border border-white shadow-lg"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mb-4">
        {apiReading && <div className="text-blue-600 dark:text-blue-300 font-medium">Reading receipt...</div>}
        {apiLoading && <div className="text-blue-600 dark:text-blue-300 font-medium">Processing receipt...</div>}
        {apiError && <div className="text-red-600 font-medium">{apiError}</div>}
        {apiResult && (
          <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-4 text-xs overflow-x-auto mt-2 text-gray-800 dark:text-gray-100">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        )}
      </div>
      {/* Section: Receipt Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="receipt_no">Receipt No.</label>
          <input id="receipt_no" name="receipt_no" type="text" value={form.receipt_no} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="date">Date</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleFormChange} required className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="category">Category</label>
          <input id="category" name="category" type="text" value={form.category} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {/* Section: Vendor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vendor">Vendor</label>
          <input id="vendor" name="vendor" type="text" value={form.vendor} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vendor_tax_id">Vendor Tax Payer ID</label>
          <input id="vendor_tax_id" name="vendor_tax_id" type="text" value={form.vendor_tax_id} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {/* Section: Buyer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_name">Buyer Name (optional)</label>
          <input id="buyer_name" name="buyer_name" type="text" value={form.buyer_name} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_address">Buyer Address (optional)</label>
          <input id="buyer_address" name="buyer_address" type="text" value={form.buyer_address} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_tax_id">Buyer Tax Payer ID (optional)</label>
          <input id="buyer_tax_id" name="buyer_tax_id" type="text" value={form.buyer_tax_id} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {/* Section: Totals & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="grand_total">Grand Total</label>
          <input id="grand_total" name="grand_total" type="number" step="0.01" min="0" value={form.grand_total} onChange={handleFormChange} required className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vat">VAT</label>
          <input id="vat" name="vat" type="number" step="0.01" min="0" value={form.vat} onChange={handleFormChange} required className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="payment_type">Payment Type</label>
          <select id="payment_type" name="payment_type" value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="cash">Cash</option>
            <option value="transfer/credit/check">Transfer/Credit Card/Check</option>
          </select>
        </div>
      </div>
      {/* Section: Notes */}
      <div className="sm:col-span-2">
        <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" value={form.notes} onChange={handleFormChange} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button
        type="submit"
        className="mt-4 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        Log Receipt
      </button>
    </form>
  );
}
