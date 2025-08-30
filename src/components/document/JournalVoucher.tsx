import React, { useState, useEffect } from 'react';
import type { FC } from 'react';

interface AccountOption {
    accountNumber: string;
    accountName: string;
}

interface JournalEntry {
    account: string;
    description: string;
    debit: number;
    credit: number;
}

const emptyEntry: JournalEntry = {
    account: '',
    description: '',
    debit: 0,
    credit: 0,
};

interface JournalVoucherProps {
    initialValues?: Partial<{
        date: string;
        notes: string;
        category: string;
        entries: JournalEntry[];
        receipt_no?: string;
    }>;
    mode?: 'edit' | 'create';
    onSubmit?: (form: any) => void;
    onCancel?: () => void;
}

const JournalVoucher: FC<JournalVoucherProps> = ({ initialValues, mode = 'create', onSubmit, onCancel }) => {
    const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'เลือกหมวดหมู่' }
]);
    const getToday = () => {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    };
    const [date, setDate] = useState(initialValues?.date || getToday());
    const [notes, setNotes] = useState(initialValues?.notes || '');
    const [category, setCategory] = useState(initialValues?.category || '');
    const [entries, setEntries] = useState<JournalEntry[]>(initialValues?.entries && initialValues.entries.length > 0 ? initialValues.entries : [{ ...emptyEntry }]);
    const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
    const [rules, setRules] = useState<Record<string, any>>({});

    // Field-level error state
    const [errors, setErrors] = useState<{
        date?: string;
        category?: string;
        entries?: string;
        entryErrors?: { account?: string; debit?: string; credit?: string }[];
    }>({});

    useEffect(() => {
        fetch('/api/account-chart')
            .then(res => res.json())
            .then(data => {
                let accounts: AccountOption[] = [];
                if (Array.isArray(data.accounts)) {
                    accounts = data.accounts;
                    setAccountOptions(data.accounts);
                } else if (Array.isArray(data)) {
                    accounts = data;
                    setAccountOptions(data);
                } else {
                    setAccountOptions([]);
                }
                if (data.rules) {
                    setRules(data.rules);
                } else {
                    setRules({});
                }
                // Set category options from journalTypeLabels
                if (data.journalTypeLabels && typeof data.journalTypeLabels === 'object') {
                    const opts = Object.entries(data.journalTypeLabels).map(([value, label]) => ({ value, label: String(label) }));
                    setCategoryOptions([{ value: '', label: 'เลือกหมวดหมู่' }, ...opts]);
                }
            })
            .catch(() => {
                setAccountOptions([]);
                setRules({});
                setCategoryOptions([{ value: '', label: 'เลือกหมวดหมู่' }]);
            });
    }, []);

    // Always sync fields from initialValues when mode, initialValues, or accountOptions change
    useEffect(() => {
        // Map category label to value, only allow exact match
        function getCategoryValue(label: string | undefined): string {
            if (!label) return '';
            const found = categoryOptions.find(opt => opt.label === label || opt.value === label);
            if (found) return found.value;
            return '';
        }

        // Map products to entries if entries missing
        function productsToEntries(products: any[]): JournalEntry[] {
            if (!products || !Array.isArray(products)) return [{ ...emptyEntry }];
            return products.map((p: any) => {
                // If pricePerItem is negative or product is a credit, set credit, else debit
                const price = Number(p.pricePerItem) || 0;
                // Heuristic: if name/account is 3xxx or 4xxx, treat as credit, else debit
                let isCredit = false;
                if (typeof p.name === 'string' && (p.name.startsWith('3') || p.name.startsWith('4'))) {
                    isCredit = true;
                }
                return {
                    account: p.name || '',
                    description: p.description || '',
                    debit: isCredit ? 0 : price,
                    credit: isCredit ? price : 0,
                };
            });
        }

        if (mode === 'edit' && initialValues && accountOptions.length > 0) {
            setDate(initialValues.date || getToday());
            setNotes(initialValues.notes || '');
            // Map category label or value for dropdown
            let catValue = getCategoryValue(initialValues.category);
            if (!catValue && typeof (initialValues as any).type === 'string') {
                catValue = getCategoryValue((initialValues as any).type);
            }
            // Debug log for category value and options
            console.log('Setting category dropdown value:', catValue, 'from', initialValues.category, 'options:', categoryOptions.map(o => o.value));
            setCategory(typeof catValue === 'string' ? catValue : '');
            // Prefer entries, else map from products
            let entriesToSet: JournalEntry[] = [];
            if (initialValues.entries && initialValues.entries.length > 0) {
                entriesToSet = normalizeEntries(initialValues.entries, accountOptions);
            } else if ((initialValues as any).products && (initialValues as any).products.length > 0) {
                entriesToSet = normalizeEntries(productsToEntries((initialValues as any).products), accountOptions);
            } else {
                entriesToSet = [{ ...emptyEntry }];
            }
            setEntries(entriesToSet);
        } else if (mode === 'create') {
            setDate(getToday());
            setNotes('');
            setCategory('');
            setEntries([{ ...emptyEntry }]);
        }
    }, [initialValues, mode, accountOptions]);

    // Patch: Normalize initial entries to always use accountNumber-accountName for dropdown value
    function normalizeEntries(entries: JournalEntry[], accountOptions: AccountOption[]): JournalEntry[] {
        return entries.map(entry => {
            if (!entry.account) return entry;
            // If already in accountNumber-accountName format, return as is
            if (entry.account.includes('-')) return entry;
            // Try to find accountName
            const acc = accountOptions.find(a => a.accountNumber === entry.account);
            if (acc) {
                return { ...entry, account: acc.accountNumber + (acc.accountName ? '-' + acc.accountName : '') };
            }
            return entry;
        });
    }

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cat = e.target.value;
        setCategory(cat);
        if (rules[cat] && Array.isArray(rules[cat]) && accountOptions.length > 0) {
            // rules[cat] is an array of {debit, credit, description}
            const newEntries: JournalEntry[] = rules[cat].map((rule: any) => {
                let accountCode = rule.debit || rule.credit || '';
                let isDebit = !!rule.debit;
                // If multiple accounts (e.g. '1000|1010'), pick the first
                if (typeof accountCode === 'string' && accountCode.includes('|')) {
                    accountCode = accountCode.split('|')[0];
                }
                // Find account in accountOptions
                const acc = accountOptions.find(a => a.accountNumber === accountCode);
                return {
                    account: acc ? (acc.accountNumber + (acc.accountName ? '-' + acc.accountName : '')) : '',
                    description: rule.description || '',
                    debit: isDebit ? 0 : 0,
                    credit: !isDebit ? 0 : 0,
                };
            });
            setEntries(newEntries.length ? newEntries : [{ ...emptyEntry }]);
            setNotes(categoryOptions.find(opt => opt.value === cat)?.label || '');
        } else {
            setEntries([{ ...emptyEntry }]);
            setNotes('');
        }
        setErrors({}); // Reset errors on category change
    };

    const handleEntryChange = (idx: number, field: keyof JournalEntry, value: string | number) => {
        setEntries(prev => prev.map((entry, i) => i === idx ? { ...entry, [field]: value } : entry));
        setErrors(e => ({ ...e, entryErrors: undefined, entries: undefined })); // Clear entry errors on edit
    };

    const addEntry = () => {
        setEntries(prev => [...prev, { ...emptyEntry }]);
        setErrors(e => ({ ...e, entryErrors: undefined, entries: undefined }));
    };
    const removeEntry = (idx: number) => {
        setEntries(prev => prev.filter((_, i) => i !== idx));
        setErrors(e => ({ ...e, entryErrors: undefined, entries: undefined }));
    };

    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);

    // Validation
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!date) newErrors.date = 'กรุณาระบุวันที่';
        if (!category) newErrors.category = 'กรุณาเลือกหมวดหมู่';
        // Entry-level errors
        let entryErrors: { account?: string; debit?: string; credit?: string }[] = [];
        let hasEntryError = false;
        entries.forEach((entry, idx) => {
            const err: { account?: string; debit?: string; credit?: string } = {};
            if (!entry.account) err.account = 'กรุณาเลือกบัญชี';
            if (Number(entry.debit) < 0) err.debit = 'เดบิตต้องไม่ติดลบ';
            if (Number(entry.credit) < 0) err.credit = 'เครดิตต้องไม่ติดลบ';
            // Only check for missing debit/credit if total of both sides is 0
            if (totalDebit === 0 && totalCredit === 0 && Number(entry.debit) === 0 && Number(entry.credit) === 0) {
                err.debit = 'ต้องระบุเดบิตหรือเครดิต';
                err.credit = 'ต้องระบุเดบิตหรือเครดิต';
            }
            if (Object.keys(err).length > 0) hasEntryError = true;
            entryErrors.push(err);
        });
        if (hasEntryError) newErrors.entryErrors = entryErrors;
        // Table-level errors
        if (totalDebit !== totalCredit || totalDebit <= 0) {
            newErrors.entries = 'ยอดเดบิตและเครดิตต้องเท่ากัน และมากกว่า 0';
        }
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitAttempted(true);
        const validation = validate();
        setErrors(validation);
        if (Object.keys(validation).length === 0) {
            // Fetch company info for vendor
            let vendor = '';
            let vendor_tax_id = '';
            try {
                const companyRes = await fetch('/api/company-profile');
                if (companyRes.ok) {
                    const company = await companyRes.json();
                    vendor = company.company_name || '';
                    vendor_tax_id = company.tax_id || '';
                }
            } catch { }

            const products = entries.map(entry => {
                const isDebit = Number(entry.debit) > 0;
                const price = isDebit ? Number(entry.debit) : Number(entry.credit);
                return {
                    name: entry.account,
                    quantity: "1",
                    pricePerItem: price.toString(),
                    price: price.toString(),
                    description: entry.description,
                    weight: "0"
                };
            });

            // Build payment object from debit accounts using paymentTypeMap
            let payment: Record<string, string> = {};
            if (rules && rules.paymentTypeMap) {
                Object.entries(rules.paymentTypeMap).forEach(([payType, accNum]) => {
                    if (typeof accNum !== 'string') return;
                    // Some accNum may be a string with multiple codes separated by |
                    const accNums = accNum.split('|');
                    const entry = entries.find(e => {
                        // Extract account number from e.account (may be '1010-เงินฝากธนาคาร')
                        const acc = e.account.split('-')[0];
                        return accNums.includes(acc) && Number(e.debit) > 0;
                    });
                    if (entry && Number(entry.debit) > 0) {
                        payment[payType] = entry.debit.toString();
                    }
                });
            }

            // Generate receipt_no for create mode
            let receipt_no = '';
            if (mode === 'create') {
                try {
                    // Use /api/receipt-log to get all receipts and find the next JV number
                    const res = await fetch('/api/receipt-log');
                    if (res.ok) {
                        const data = await res.json();
                        // Find all JV receipt_no
                        const jvNos = Array.isArray(data)
                            ? data
                                .map((obj: any) => obj && obj.receipt_no && typeof obj.receipt_no === 'string' && obj.receipt_no.startsWith('JV-') ? obj.receipt_no : null)
                                .filter(Boolean)
                            : [];
                        let maxNum = 0;
                        jvNos.forEach(no => {
                            const match = typeof no === 'string' && no.match(/^JV-(\d{4})$/);
                            if (match) {
                                const num = parseInt(match[1], 10);
                                if (num > maxNum) maxNum = num;
                            }
                        });
                        const nextNum = (maxNum + 1).toString().padStart(4, '0');
                        receipt_no = `JV-${nextNum}`;
                    } else {
                        receipt_no = 'JV-0001';
                    }
                } catch {
                    receipt_no = 'JV-0001';
                }
            } else if (initialValues && initialValues.receipt_no) {
                receipt_no = initialValues.receipt_no;
            }

                        // In edit mode, preserve the original type unless the user changes category
                                    let typeToSend = category;
                                    // Allow initialValues to have a 'type' property for edit mode
                                    const initialType = (initialValues as any).type;
                                    if (mode === 'edit' && initialValues && typeof initialType === 'string') {
                                            // If category is unchanged from initial load, use original type
                                            const originalCategory = (() => {
                                                if (categoryOptions.some(opt => opt.value === initialType)) {
                                                    return initialType;
                                                }
                                                if (categoryOptions.some(opt => opt.value === initialValues.category)) {
                                                    return initialValues.category;
                                                }
                                                return '';
                                            })();
                                            if (category === originalCategory) {
                                                typeToSend = initialType;
                                            }
                                    }
                        const formData = {
                                date,
                                type: typeToSend,
                                products,
                                category: categoryOptions.find(opt => opt.value === category)?.label || '',
                                vendor,
                                vendor_tax_id,
                                receipt_no,
                                grand_total: entries.reduce((sum, entry) => sum + Number(entry.debit), 0),
                                notes: notes,
                                payment,
                                systemGenerated: true,
                                entries,
                        };

            if (onSubmit) {
                onSubmit(formData);
                if (mode !== 'edit') {
                    window.alert('ออกเอกสารสำเร็จ');
                    setDate(getToday());
                    setNotes('');
                    setCategory('');
                    setEntries([{ ...emptyEntry }]);
                    setSubmitAttempted(false);
                    setErrors({});
                }
            } else {
                // Default: POST to API (for standalone usage)
                try {
                    const res = await fetch('/api/receipt-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                    });
                    if (!res.ok) throw new Error('API error');
                    window.alert('ออกเอกสารสำเร็จ');
                    setDate(getToday());
                    setNotes('');
                    setCategory('');
                    setEntries([{ ...emptyEntry }]);
                    setSubmitAttempted(false);
                    setErrors({});
                } catch (err) {
                    window.alert('เกิดข้อผิดพลาดในการออกเอกสาร');
                }
            }
        }
    };

    return (
        <section className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl p-6 mt-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Journal Voucher</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">วันที่</label>
                        <input
                            type="date"
                            className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${submitAttempted && errors.date ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'}`}
                            value={date}
                            onChange={e => { setDate(e.target.value); setErrors(err => ({ ...err, date: undefined })); }}
                            required
                        />
                        {submitAttempted && errors.date && (
                            <div className="text-red-600 text-xs mt-1">{errors.date}</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">หมวดหมู่</label>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${submitAttempted && (!category || errors.category) ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'}`}
                            value={category}
                            onChange={handleCategoryChange}
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {submitAttempted && errors.category && (
                            <div className="text-red-600 text-xs mt-1">{errors.category}</div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className={`w-full text-sm border rounded-lg mt-2 ${submitAttempted && errors.entries ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'} bg-white dark:bg-neutral-900`}>
                        <thead>
                            <tr className="bg-gray-100 dark:bg-neutral-800">
                                <th className="p-2 border border-gray-200 dark:border-neutral-700">บัญชี</th>
                                <th className="p-2 border border-gray-200 dark:border-neutral-700">รายละเอียด</th>
                                <th className="p-2 border border-gray-200 dark:border-neutral-700">เดบิต</th>
                                <th className="p-2 border border-gray-200 dark:border-neutral-700">เครดิต</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-200 dark:border-neutral-700 p-1">
                                        <select
                                            className={`w-full rounded-lg border px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60 border-gray-200 dark:border-neutral-700`}
                                            value={entry.account}
                                            aria-label="Account"
                                            disabled
                                            tabIndex={-1}
                                        >
                                            <option value="">เลือกบัญชี</option>
                                            {accountOptions.map(opt => (
                                                <option key={opt.accountNumber} value={opt.accountNumber + (opt.accountName ? '-' + opt.accountName : '')}>
                                                    {opt.accountNumber}{opt.accountName ? ' - ' + opt.accountName : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {submitAttempted && errors.entryErrors && errors.entryErrors[idx]?.account && (
                                            <div className="text-red-600 text-xs mt-1">{errors.entryErrors[idx].account}</div>
                                        )}
                                    </td>
                                    <td className="border border-gray-200 dark:border-neutral-700 p-1">
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={entry.description}
                                            onChange={e => handleEntryChange(idx, 'description', e.target.value)}
                                            aria-label="Entry Description"
                                        />
                                    </td>
                                    <td className="border border-gray-200 dark:border-neutral-700 p-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`w-full rounded-lg border px-2 py-1 text-right bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${submitAttempted && errors.entryErrors && errors.entryErrors[idx]?.debit ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'}`}
                                            value={entry.debit}
                                            min={0}
                                            onChange={e => handleEntryChange(idx, 'debit', Number(e.target.value))}
                                            aria-label="Debit"
                                        />
                                        {submitAttempted && errors.entryErrors && errors.entryErrors[idx]?.debit && (
                                            <div className="text-red-600 text-xs mt-1">{errors.entryErrors[idx].debit}</div>
                                        )}
                                    </td>
                                    <td className="border border-gray-200 dark:border-neutral-700 p-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`w-full rounded-lg border px-2 py-1 text-right bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${submitAttempted && errors.entryErrors && errors.entryErrors[idx]?.credit ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'}`}
                                            value={entry.credit}
                                            min={0}
                                            onChange={e => handleEntryChange(idx, 'credit', Number(e.target.value))}
                                            aria-label="Credit"
                                        />
                                        {submitAttempted && errors.entryErrors && errors.entryErrors[idx]?.credit && (
                                            <div className="text-red-600 text-xs mt-1">{errors.entryErrors[idx].credit}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 dark:bg-neutral-800 font-semibold">
                                <td colSpan={2} className="border border-gray-200 dark:border-neutral-700 p-1 text-right">Total</td>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{totalDebit.toLocaleString()}</td>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{totalCredit.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    {submitAttempted && errors.entries && (
                        <div className="text-red-600 text-xs mt-2">{errors.entries}</div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">หมายเหตุ</label>
                    <textarea
                        className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder=""
                    />
                </div>
                <div className="flex flex-col items-end gap-2 md:flex-row md:justify-end md:items-center">
                    {onCancel && (
                        <button
                            type="button"
                            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            onClick={onCancel}
                        >
                            ยกเลิก
                        </button>
                    )}
                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {mode === 'edit' ? 'บันทึก' : 'ออกเอกสาร'}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default JournalVoucher;
export { JournalVoucher };
