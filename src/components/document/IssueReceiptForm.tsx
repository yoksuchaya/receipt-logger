import React, { useState, useEffect } from 'react';


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
    bank?: string;
    receipt_no: string;
    buyer_name: string;
    buyer_address: string;
    buyer_tax_id: string;
    products: Product[];
};

const emptyForm: FormState = {
    date: '',
    grand_total: '',
    vat: '',
    vendor: '',
    vendor_tax_id: '',
    category: '',
    notes: '',
    payment: { cash: '' },
    bank: '',
    receipt_no: '',
    buyer_name: '',
    buyer_address: '',
    buyer_tax_id: '',
    products: [],
};


const IssueReceiptForm: React.FC = () => {
    const [form, setForm] = useState<FormState>(emptyForm);
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [invalidFields, setInvalidFields] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        async function fetchProfile() {
            const res = await fetch('/api/company-profile');
            const data = await res.json();
            setCompanyProfile(data);
            setForm(f => ({
                ...f,
                vendor: data.company_name || '',
                vendor_tax_id: data.tax_id || '',
            }));
        }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (error) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm((prev) => {
            let updated = { ...prev, [name]: value };
            // If category changes, reset products
            if (name === 'category') {
                updated.products = [];
            }
            setTimeout(() => updateReceiptNo(updated, name === 'date'), 0);
            return updated;
        });
    }

    async function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        if (name === 'date') {
            setForm((prev) => {
                const updated = { ...prev, date: value };
                setTimeout(() => updateReceiptNo(updated, true), 0);
                return updated;
            });
        } else if (name.startsWith('payment.')) {
            const key = name.split('.')[1];
            setForm((prev) => ({ ...prev, payment: { ...prev.payment, [key]: value } }));
        } else {
            setForm((prev) => {
                const updated = { ...prev, [name]: value };
                setTimeout(() => updateReceiptNo(updated, false), 0);
                return updated;
            });
        }
    }

    // Helper to update receipt_no if date, bank, and category are set

    async function updateReceiptNo(form: FormState, isDateChange: boolean) {
        const { date, bank, category } = form;
        if (!date || !bank || !category) {
            setForm((prev) => ({ ...prev, receipt_no: '' }));
            return;
        }
        // Map category and bank to codes
        const categoryMap: Record<string, string> = {
            'bullion': 'B',
            'ornament': 'O',
        };
        const bankMap: Record<string, string> = {
            'aeon': 'A',
            'krungsri': 'KS',
            'kbank': 'KB',
            'scb': 'SC',
            'cash': 'C',
        };
        const catCode = categoryMap[category] ?? '';
        const bankCode = bankMap[bank] ?? '';
        if (!catCode || !bankCode) {
            setForm((prev) => ({ ...prev, receipt_no: '' }));
            return;
        }
        let running = 1;
        const [year, mon] = date.split('-');
        const month = `${year}-${mon}`;
        try {
            const res = await fetch('/api/receipt-log');
            const data = await res.json();
            const filtered = data
                .filter((r: any) => r && r.date && r.date.startsWith(month)
                    && r.category === companyProfile.productCategoryNames[category] && r.bank === bank
                    && r.receipt_no && r.receipt_no.startsWith('S'));
            const sameComboDates = filtered.map((r: any) => r.date);
            const sortedDates = Array.from(new Set(sameComboDates)).sort();
            running = sortedDates.indexOf(date) + 2;
        } catch { }
        setForm((prev) => ({
            ...prev,
            receipt_no: `S${catCode}-${bankCode}-${String(running).padStart(5, '0')}`,
        }));
    }

    function handleProductChange(index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm((prev) => {
            const products = prev.products.map((p, i) =>
                i === index ? { ...p, [name]: value } : p
            );
            return { ...prev, products };
        });
    }

    function handleAddProduct() {
        if (!form.category) return;
        setForm((prev) => ({
            ...prev,
            products: [
                ...prev.products,
                { name: '', weight: '', quantity: '1', pricePerItem: '', price: '' },
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
        setError(null);
        const newInvalid: { [key: string]: boolean } = {};
        // Validation: date, category, bank must be selected
        if (!form.date) newInvalid.date = true;
        if (!form.category) newInvalid.category = true;
        if (!form.bank) newInvalid.bank = true;
        // Validation: grand_total must not be empty or 0
        const grandTotal = parseFloat(form.grand_total);
        if (!form.grand_total || isNaN(grandTotal) || grandTotal === 0) newInvalid.grand_total = true;
        // Validation: must have at least one product if grand_total is set and not zero
        if (grandTotal > 0 && (!form.products || form.products.length === 0)) {
            newInvalid.products = true;
        }
        // Validation: sum of product prices === grand_total
        const sumProduct = form.products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
        if (form.products.length > 0 && Math.abs(sumProduct - grandTotal) > 0.01) {
            newInvalid.products = true;
            // Mark each product price as invalid if sum doesn't match
            form.products.forEach((p, idx) => {
                newInvalid[`product_price_${idx}`] = true;
            });
        }
        // Validation: sum of payment types === grand_total
        const sumPayment = (['cash', 'credit_card', 'transfer'] as (keyof PaymentMap)[]).reduce(
            (sum, type) => sum + (parseFloat(form.payment[type] || '0') || 0),
            0
        );
        if (Math.abs(sumPayment - grandTotal) > 0.01) newInvalid.payment = true;
        setInvalidFields(newInvalid);
        if (Object.keys(newInvalid).length > 0) {
            if (newInvalid.date) setError('กรุณาเลือกวันที่');
            else if (newInvalid.category) setError('กรุณาเลือกประเภทสินค้า/บริการ');
            else if (newInvalid.grand_total) setError('กรุณากรอกยอดรวมทั้งสิ้นให้ถูกต้อง (ต้องไม่เป็นค่าว่างหรือ 0)');
            else if (newInvalid.bank) setError('กรุณาเลือกธนาคาร');
            else if (newInvalid.products) {
                if (grandTotal > 0 && (!form.products || form.products.length === 0)) {
                    setError('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ');
                } else {
                    setError('กรุณาตรวจสอบผลรวมราคารวมของสินค้าทั้งหมดให้ตรงกับยอดรวมทั้งสิ้น');
                }
            }
            else if (newInvalid.payment) setError('ผลรวมช่องทางการชำระเงินไม่ตรงกับยอดรวมทั้งสิ้น');

            return;
        }
        // Log to /api/receipt-log with systemGenerated: true
        const logData = { ...form, systemGenerated: true };
        if (!logData.buyer_name || logData.buyer_name.trim() === '') {
            logData.buyer_name = 'ไม่ประสงค์ออกนาม';
        }
        if (!logData.notes || logData.notes.trim() === '') {
            const sumWeight = Array.isArray(logData.products)
                ? logData.products.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)
                : 0;
            let categoryDisplay = logData.category;
            if (companyProfile && companyProfile.productCategoryNames && companyProfile.productCategoryNames[logData.category]) {
                categoryDisplay = companyProfile.productCategoryNames[logData.category];
            }
            logData.notes = `ขาย${categoryDisplay} น้ำหนักรวม ${sumWeight} กรัม`;
            logData.category = categoryDisplay;
        }
        try {
            const res = await fetch('/api/receipt-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData),
            });
            if (!res.ok) throw new Error('Failed to log document');
            alert('ออกเอกสารเรียบร้อยแล้ว!');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการออกเอกสาร');
        }
    }

    return (
    <form className="w-full max-w-none bg-white dark:bg-neutral-900 p-6 rounded-lg shadow flex flex-col gap-6" onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ออกใบกำกับภาษี / ใบเสร็จรับเงิน (ใบขาย)</h3>
            {/* Toast error message */}
            {showToast && error && (
                <div className="fixed top-6 right-6 z-50">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="font-medium">{error}</span>
                    </div>
                </div>
            )}
            {/* Document Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="receipt_no">เลขที่เอกสาร</label>
                    <input id="receipt_no" name="receipt_no" value={form.receipt_no} disabled className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="date">วันที่</label>
                    <input
                        id="date"
                        name="date"
                        value={form.date}
                        onChange={handleFormChange}
                        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none ${invalidFields.date ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500'}`}
                        type="date"
                    // required removed to use custom validation only
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="category">ประเภทสินค้า/บริการ</label>
                    <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleSelectChange}
                        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${invalidFields.category ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700'}`}
                    >
                        <option value="">เลือกประเภท</option>
                        {companyProfile && companyProfile.productOptions &&
                            Object.entries(companyProfile.productOptions).map(([key, value]: [string, any]) => (
                                <option key={key} value={key}>
                                    {companyProfile.productCategoryNames && companyProfile.productCategoryNames[key]
                                        ? companyProfile.productCategoryNames[key]
                                        : key}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            {/* Seller/Buyer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vendor">ชื่อผู้ขาย</label>
                    <input id="vendor" name="vendor" value={form.vendor} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" disabled />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vendor_tax_id">เลขประจำตัวผู้เสียภาษีผู้ขาย</label>
                    <input id="vendor_tax_id" name="vendor_tax_id" value={form.vendor_tax_id} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" disabled />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_name">ชื่อผู้ซื้อ (ถ้ามี)</label>
                    <input id="buyer_name" name="buyer_name" value={form.buyer_name} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_address">ที่อยู่ผู้ซื้อ (ถ้ามี)</label>
                    <input id="buyer_address" name="buyer_address" value={form.buyer_address} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
                </div>
                <div className="sm:col-span-2">
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="buyer_tax_id">เลขประจำตัวผู้เสียภาษีผู้ซื้อ (ถ้ามี)</label>
                    <input id="buyer_tax_id" name="buyer_tax_id" value={form.buyer_tax_id} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
                </div>
            </div>
            {/* Totals & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="grand_total">ยอดรวมทั้งสิ้น</label>
                    <input
                        id="grand_total"
                        name="grand_total"
                        value={form.grand_total}
                        onChange={handleFormChange}
                        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none ${invalidFields.grand_total ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500'}`}
                        type="number"
                        min="0"
                        step="any"
                    // required removed to use custom validation only
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="vat">ภาษีมูลค่าเพิ่ม (VAT)</label>
                    <input
                        id="vat"
                        name="vat"
                        value={form.vat}
                        onChange={handleFormChange}
                        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none ${invalidFields.vat ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500'}`}
                        type="number"
                        min="0"
                        step="any"
                    // required removed to use custom validation only
                    />
                </div>
            </div>
            {/* Payment breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {(['cash', 'credit_card', 'transfer'] as const).map((type) => {
                    // If cash is filled (not empty and not zero), disable other payment types
                    const cashFilled = !!form.payment.cash && parseFloat(form.payment.cash) > 0;
                    const isDisabled = type !== 'cash' && cashFilled;
                    return (
                        <div key={type}>
                            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor={`payment.${type}`}>
                                {type === 'cash' ? 'เงินสด' : type === 'credit_card' ? 'บัตรเครดิต' : 'โอนเงิน'}
                            </label>
                            <input
                                id={`payment.${type}`}
                                name={`payment.${type}`}
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${invalidFields.payment ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700'} ${isDisabled ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}`}
                                value={form.payment[type] || ''}
                                onChange={handleFormChange}
                                placeholder="0.00"
                                disabled={isDisabled}
                            />
                        </div>
                    );
                })}
                {/* Bank selection dropdown */}
                <div>
                    <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="bank">ธนาคาร</label>
                    <select
                        id="bank"
                        name="bank"
                        value={form.bank || ''}
                        onChange={handleSelectChange}
                        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${invalidFields.bank ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700'}`}
                    >
                        <option value="">เลือกธนาคาร</option>
                        <option value="cash">เงินสด</option>
                        <option value="aeon">AEON</option>
                        <option value="ks">Krungsri</option>
                        <option value="kbank">Kasikorn</option>
                        <option value="scb">SCB</option>
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block font-medium mb-1 text-gray-800 dark:text-gray-100" htmlFor="notes">หมายเหตุ</label>
                <textarea id="notes" name="notes" value={form.notes} onChange={handleFormChange} className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
            </div>
            {/* Products Section */}
            <div className={`w-full bg-white dark:bg-neutral-900 rounded-xl p-4 mt-6 shadow-sm border ${invalidFields.products ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-200 dark:border-neutral-700'}`}>
                <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">รายการสินค้า/บริการ</span>
                    <button
                        type="button"
                        onClick={handleAddProduct}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm border transition
                            ${form.category
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 dark:border-green-800'
                                : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-neutral-800 dark:text-gray-500 dark:border-neutral-700 cursor-not-allowed'}
                        `}
                        disabled={!form.category}
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
                                {companyProfile && companyProfile.productOptions && companyProfile.productOptions[form.category] ? (
                                    <select
                                        id={`product-name-${idx}`}
                                        name="name"
                                        value={product.name}
                                        onChange={e => handleProductChange(idx, e)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">เลือกสินค้า</option>
                                        {companyProfile.productOptions[form.category].map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
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
                                )}
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
                                    className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${invalidFields[`product_price_${idx}`] ? 'border-red-500 ring-2 ring-red-400' : 'border-gray-300 dark:border-neutral-700'}`}
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
                ออกเอกสาร
            </button>
        </form>
    );
};

export default IssueReceiptForm;
