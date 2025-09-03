

import { useState, useEffect } from "react";
import VatBreadcrumb from "./VatBreadcrumb";
import ReceiptEditForm from "../receipt/ReceiptEditForm";
import ReceiptDetail from "../receipt/ReceiptDetail";
import ReportHeader from "../common/ReportHeader";
import { monthOptions, getMonthLabel } from "../utils/monthLabels";
import VatSaleReportTable from "./VatSaleReportTable";
import VatPurchaseReportTable from "./VatPurchaseReportTable";
import PrintWrapper from "../layout/PrintWrapper";
import { formatMoney } from "../utils/utils";
import { VatSale } from "./VatSaleReportTable";
import { VatPurchase } from "./VatPurchaseReportTable";
import { getPP30Log } from "./pp30logApi";
import { PP30Log } from "../types/PP30Log";

const getCurrentMonthYear = () => {
    const now = new Date();
    return {
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
        year: now.getFullYear().toString(),
    };
};

const yearOptions = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());

const VatSummary: React.FC = () => {
    // Handler to print PP30 form (must be inside component to access state)
    const handlePrintPP30 = async () => {
        const res = await fetch('/api/pp30-fill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                month,
                year,
                salesVat: sumSalesVat,
                purchasesVat: sumPurchasesVat,
                netVat,
                companyName: companyProfile?.company_name || '',
                taxId: companyProfile?.tax_id || '',
                totalSales: sumSalesTotal,
                salesAmountExcludeVat: sumSalesTotal - sumSalesTotal,
                totalPurchases: sumPurchasesTotal,
                companyAddress: companyProfile?.address,
                phoneNo: companyProfile?.phones[0] || '',
            }),
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    };
    const { month: initialMonth, year: initialYear } = getCurrentMonthYear();
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sales, setSales] = useState<VatSale[]>([]);
    const [purchases, setPurchases] = useState<VatPurchase[]>([]);
    const [tab, setTab] = useState<'sales' | 'purchases'>('sales');
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [edit, setEdit] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [pp30Log, setPP30Log] = useState<PP30Log | null>(null);
    const [pp30Loading, setPP30Loading] = useState(false);
    // Handler for row actions (view or edit)
    const handleRowAction = (row: any, isEdit = false) => {
        setSelectedRow(row);
        setEdit(isEdit);
        setEditForm(row);
    };
    const handleBack = () => {
        setSelectedRow(null);
        setEdit(false);
    };

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const [salesRes, purchasesRes] = await Promise.all([
                fetch(`/api/vat-sale-report?month=${month}&year=${year}`),
                fetch(`/api/vat-purchase-report?month=${month}&year=${year}`),
            ]);
            if (!salesRes.ok) throw new Error("โหลดข้อมูลภาษีขายล้มเหลว");
            if (!purchasesRes.ok) throw new Error("โหลดข้อมูลภาษีซื้อล้มเหลว");
            const salesData = await salesRes.json();
            const purchasesData = await purchasesRes.json();
            setSales(salesData.sales || []);
            setPurchases(purchasesData.purchases || []);
        } catch (e: any) {
            setError(e.message || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    // Print header info
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    useEffect(() => {
        fetch('/api/company-profile')
            .then(res => res.json())
            .then(data => setCompanyProfile(data))
            .catch(() => setCompanyProfile(null));
    }, []);

    useEffect(() => {
        fetchData();
        setPP30Loading(true);
        getPP30Log(month, year)
            .then(log => setPP30Log(log))
            .finally(() => setPP30Loading(false));
        // eslint-disable-next-line
    }, [month, year]);

    const printDate = new Date();
    const printDateStr = printDate.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const thaiMonth = getMonthLabel(month);

    // Calculate sums
    const sumSalesVat = sales.reduce((sum, s) => sum + (Number(s.vat) || 0), 0);
    const sumPurchasesVat = purchases.reduce((sum, p) => sum + (Number(p.vat) || 0), 0);
    const netVat = sumSalesVat - sumPurchasesVat;
    const netLabel = netVat > 0 ? "ภาษีมูลค่าเพิ่มที่ต้องชำระ" : netVat < 0 ? "ภาษีมูลค่าเพิ่มขอคืน/ยกยอด" : "-";
    const netBadgeColor = netVat > 0 ? "bg-red-500" : netVat < 0 ? "bg-green-500" : "bg-gray-400";
    const sumSalesExVat = sales.reduce((sum, s) => sum + (Number(s.grand_total) - Number(s.vat)), 0);
    const sumSalesTotal = sales.reduce((sum, s) => sum + Number(s.grand_total), 0);
    const sumPurchasesExVat = purchases.reduce((sum, p) => sum + (Number(p.grand_total) - Number(p.vat)), 0);
    const sumPurchasesTotal = purchases.reduce((sum, p) => sum + Number(p.grand_total), 0);
    const salesForTable = sales.map(s => ({ ...s, vat: s.vat }));
    const purchasesForTable = purchases.map(p => ({ ...p, vat: p.vat }));

    return (
        <PrintWrapper printLabel={`รายงานสรุปภาษีมูลค่าเพิ่ม (ภ.พ.30) - ${thaiMonth}/${year}`} printButtonLabel="พิมพ์รายงานสรุปภาษีมูลค่าเพิ่ม">
            {/* PP30 Panel */}
            <div className="w-full flex justify-end mt-2 mb-2 print:hidden">
                <button
                    onClick={handlePrintPP30}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow"
                >
                    พิมพ์แบบภพ.30
                </button>
            </div>
            <div className="w-full mb-4 print:hidden">
                {netVat === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="text-green-800 font-medium">ไม่มีภาษีต้องชำระ</div>
                    </div>
                ) :
                    (!pp30Loading && !pp30Log) ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                            <div className="text-yellow-800 font-medium">ยังไม่ได้ยื่นแบบ ภ.พ.30 สำหรับเดือนนี้</div>
                            <button
                                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded shadow"
                                onClick={async () => {
                                    // Log PP30
                                    const pp30Log = {
                                        month,
                                        year,
                                        status: netVat < 0 ? 'paid' : 'submitted',
                                        amount: netVat,
                                        created_at: new Date().toISOString(),
                                    };
                                    await fetch('/api/pp30-log', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(pp30Log),
                                    });
                                    // Issue vat_closing document
                                    const now = new Date();
                                    // Fetch account chart rules and journalTypeLabels for vat_closing
                                    let rules: any = {};
                                    let journalTypeLabels: any = {};
                                    try {
                                        const res = await fetch('/api/account-chart');
                                        if (res.ok) {
                                            const data = await res.json();
                                            rules = data.rules || {};
                                            journalTypeLabels = data.journalTypeLabels || {};
                                            rules.accounts = data.accounts || [];
                                        }
                                    } catch { }
                                    // Helper to get account label
                                    const getAcc = (num: string | undefined) => {
                                        if (!num) return '';
                                        const acc = (rules.accounts || []).find((a: any) => a.accountNumber === num);
                                        return acc ? `${acc.accountNumber}-${acc.accountName}` : num;
                                    };

                                    // Select rule based on VAT situation
                                    let closingRule: any[] = [];
                                    let closingType = '';
                                    let closingLabel = '';
                                    if (netVat > 0) {
                                        closingRule = Array.isArray(rules.vat_closing_payable) ? rules.vat_closing_payable : [];
                                        closingType = 'vat_closing_payable';
                                        closingLabel = journalTypeLabels["vat_closing_payable"] || "ปิดบัญชีภาษีมูลค่าเพิ่ม (ต้องชำระ)";
                                    } else if (netVat < 0) {
                                        closingRule = Array.isArray(rules.vat_closing_credit) ? rules.vat_closing_credit : [];
                                        closingType = 'vat_closing_credit';
                                        closingLabel = journalTypeLabels["vat_closing_credit"] || "ปิดบัญชีภาษีมูลค่าเพิ่ม (ขอคืน/ยกยอด)";
                                    } else {
                                        closingRule = Array.isArray(rules.vat_closing_payable) ? rules.vat_closing_payable : [];
                                        closingType = 'vat_closing_payable';
                                        closingLabel = journalTypeLabels["vat_closing_payable"] || "ปิดบัญชีภาษีมูลค่าเพิ่ม (ศูนย์)";
                                    }

                                    // Prepare values for rule mapping
                                    const vatInput = sumPurchasesVat;
                                    const vatOutput = sumSalesVat;
                                    const payable = Math.max(0, netVat);
                                    const credit = Math.max(0, -netVat);

                                    // Map rule to entries
                                    const entries: any[] = closingRule.map((rule: any) => {
                                        // Determine account
                                        let account = rule.debit || rule.credit || '';
                                        if (account.includes("|")) {
                                            account = account.split("|")[0];
                                        }
                                        const accLabel = getAcc(account);
                                        // Determine amount
                                        let amount: number | undefined = undefined;
                                        if (rule.amount === "vatInput") amount = vatInput;
                                        else if (rule.amount === "vatOutput") amount = vatOutput;
                                        else if (rule.amount === "payable") amount = payable;
                                        else if (rule.amount === "credit") amount = credit;
                                        else if (rule.amount === "min(vatOutput,vatInput)") amount = Math.min(vatOutput, vatInput);
                                        else if (!isNaN(Number(rule.amount))) amount = Number(rule.amount);
                                        // fallback: if rule.amount is not recognized at all (amount is still undefined), use Math.abs(netVat)
                                        if (typeof amount === 'undefined' && netVat !== 0) amount = Math.abs(netVat);
                                        // If amount is still undefined, set to 0
                                        if (typeof amount === 'undefined') amount = 0;
                                        return {
                                            account: accLabel,
                                            description: rule.description,
                                            debit: rule.debit ? Number(formatMoney(amount)) : 0,
                                            credit: rule.credit ? Number(formatMoney(amount)) : 0
                                        };
                                    });

                                    // Compose document
                                    const doc = {
                                        type: closingType,
                                        category: closingLabel,
                                        date: now.toISOString().slice(0, 10),
                                        issuedAt: now.toISOString(),
                                        uploadedAt: now.toISOString(),
                                        receipt_no: `VATC-${year}${month}`,
                                        vendor: companyProfile?.company_name || '',
                                        vendor_tax_id: companyProfile?.tax_id || '',
                                        buyer_name: '',
                                        buyer_tax_id: '',
                                        notes: closingLabel,
                                        systemGenerated: true,
                                        products: entries.map((e: any) => ({
                                            name: e.account,
                                            quantity: "1",
                                            pricePerItem: Number(formatMoney(e.debit > 0 ? e.debit : e.credit)),
                                            price: Number(formatMoney(e.debit > 0 ? e.debit : e.credit)),
                                            description: e.description,
                                            weight: "0"
                                        })),
                                        entries,
                                        grand_total: Number(formatMoney(entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0))),
                                        vat: "0"
                                    };
                                    await fetch('/api/receipt-log', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(doc),
                                    });
                                    // Refresh log state
                                    setPP30Loading(true);
                                    getPP30Log(month, year)
                                        .then(log => setPP30Log(log))
                                        .finally(() => setPP30Loading(false));
                                }}
                            >
                                ยื่นแบบฟอร์ม ภ.พ.30
                            </button>
                        </div>
                    ) : (
                        (pp30Log && (sumSalesVat - sumPurchasesVat !== pp30Log.amount)) ? (
                            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                                <div className="text-orange-800 font-medium">มีการบันทึกเอกสารขายหรือซื้อเพิ่มเติมหลังยื่นแบบ ภ.พ.30 กรุณายื่นภาษีเพิ่ม</div>
                                <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded shadow" onClick={() => {/* TODO: open additional filing modal */ }}>
                                    ยื่นแบบเพิ่มเติม
                                </button>
                            </div>
                        ) : (
                            pp30Log && pp30Log.status !== 'paid' && pp30Log.amount > 0 ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                                    <div className="text-blue-800 font-medium">ยื่นแบบแล้ว รอชำระภาษี (ยอดสุทธิ {formatMoney(pp30Log.amount)} บาท)</div>
                                    <button
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
                                        onClick={async () => {
                                            if (!pp30Log) return;
                                            // 1. Update PP30 log status to 'paid'
                                            await fetch('/api/pp30-log', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    ...pp30Log,
                                                    status: 'paid',
                                                    paid_at: new Date().toISOString(),
                                                }),
                                            });
                                            // 2. Fetch account chart rules and journalTypeLabels for vat_payment
                                            let rules: any = {};
                                            let journalTypeLabels: any = {};
                                            try {
                                                const res = await fetch('/api/account-chart');
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    rules = data.rules || {};
                                                    journalTypeLabels = data.journalTypeLabels || {};
                                                    rules.accounts = data.accounts || [];
                                                }
                                            } catch { }
                                            // Helper to get account label
                                            const getAcc = (num: string | undefined) => {
                                                if (!num) return '';
                                                const acc = (rules.accounts || []).find((a: any) => a.accountNumber === num);
                                                return acc ? `${acc.accountNumber}-${acc.accountName}` : num;
                                            };
                                            // 3. Prepare journal voucher for VAT payment
                                            const paymentRule = Array.isArray(rules.vat_payment) ? rules.vat_payment : [];
                                            const paymentType = 'vat_payment';
                                            const paymentLabel = journalTypeLabels["vat_payment"] || "ชำระภาษีมูลค่าเพิ่ม";
                                            const amount = pp30Log.amount;
                                            const entries: any[] = paymentRule.map((rule: any) => {
                                                let account = rule.debit || rule.credit || '';
                                                if (account.includes("|")) {
                                                    account = account.split("|")[0];
                                                }
                                                const accLabel = getAcc(account);
                                                let entryAmount: number | undefined = undefined;
                                                if (rule.amount === "payable") entryAmount = amount;
                                                else if (!isNaN(Number(rule.amount))) entryAmount = Number(rule.amount);
                                                if (typeof entryAmount === 'undefined') entryAmount = amount;
                                                return {
                                                    account: accLabel,
                                                    description: rule.description,
                                                    debit: Number(formatMoney(rule.debit ? entryAmount : 0)),
                                                    credit: Number(formatMoney(rule.credit ? entryAmount : 0))
                                                };
                                            });
                                            // Compose document
                                            const now = new Date();
                                            const doc = {
                                                type: paymentType,
                                                category: paymentLabel,
                                                date: now.toISOString().slice(0, 10),
                                                issuedAt: now.toISOString(),
                                                uploadedAt: now.toISOString(),
                                                receipt_no: `VATP-${year}${month}`,
                                                vendor: companyProfile?.company_name || '',
                                                vendor_tax_id: companyProfile?.tax_id || '',
                                                buyer_name: '',
                                                buyer_tax_id: '',
                                                notes: paymentLabel,
                                                systemGenerated: true,
                                                products: entries.map((e: any) => ({
                                                    name: e.account,
                                                    quantity: "1",
                                                    pricePerItem: Number(formatMoney(e.debit > 0 ? e.debit : e.credit)),
                                                    price: Number(formatMoney(e.debit > 0 ? e.debit : e.credit)),
                                                    description: e.description,
                                                    weight: "0"
                                                })),
                                                entries,
                                                grand_total: Number(formatMoney(entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0))),
                                                vat: "0"
                                            };
                                            await fetch('/api/receipt-log', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(doc),
                                            });
                                            // 4. Refresh log state
                                            setPP30Loading(true);
                                            getPP30Log(month, year)
                                                .then(log => setPP30Log(log))
                                                .finally(() => setPP30Loading(false));
                                        }}
                                    >
                                        ชำระภาษีแล้ว
                                    </button>
                                </div>
                            ) : (
                                pp30Log && (pp30Log.amount <= 0 || pp30Log.status === 'paid') && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                                        <div className="text-green-800 font-medium">
                                            {pp30Log.status === 'paid' ? 'ชำระภาษีแล้ว' : 'ยื่นแบบแล้ว ไม่มีภาษีต้องชำระ'}
                                        </div>
                                    </div>
                                )
                            )
                        )
                    )}
            </div>
            {/* Print-only header and summary */}
            <div className="w-full mx-auto hidden print:block">
                <ReportHeader
                    month={month}
                    year={year}
                    monthOptions={monthOptions}
                    yearOptions={yearOptions}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                    title="รายงานสรุปภาษีมูลค่าเพิ่ม (ภ.พ.30)"
                />
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border rounded">
                        <div className="text-sm">ภาษีขาย</div>
                        <div className="text-xl font-bold">฿ {formatMoney(sumSalesVat)}</div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm">ภาษีซื้อ</div>
                        <div className="text-xl font-bold">฿ {formatMoney(sumPurchasesVat)}</div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm">ภาษีมูลค่าเพิ่มสุทธิ</div>
                        <div className="text-xl font-bold">฿ {formatMoney(netVat)}</div>
                        <div className="text-xs mt-2">สถานะ: <span className="font-medium">{netLabel === '-' ? '' : netLabel.replace('ภาษีมูลค่าเพิ่ม', '')}</span></div>
                    </div>
                </div>
                {/* Print: Sales & Purchases Tables Stacked, Equal Width */}
                <div className="w-full print:mb-8 print:mt-4">
                    <div className="w-full max-w-none print:w-full print:max-w-full print:overflow-x-visible">
                        <div className="print:break-before-page"></div>
                        <div className="w-full vat-header">
                            <ReportHeader
                                month={month}
                                year={year}
                                onMonthChange={setMonth}
                                onYearChange={setYear}
                                title="รายงานภาษีขาย"
                            />
                        </div>
                        <div className="w-full print:w-full print:max-w-full print:overflow-x-visible print:table-fixed">
                            <VatSaleReportTable
                                data={salesForTable}
                                sumExVat={sumSalesExVat}
                                sumVat={sumSalesVat}
                                sumTotal={sumSalesTotal}
                            />
                        </div>
                    </div>
                    <div className="w-full max-w-none mt-8 print:w-full print:max-w-full print:overflow-x-visible">
                        <div className="print:break-before-page"></div>
                        <div className="w-full vat-header">
                            <ReportHeader
                                month={month}
                                year={year}
                                onMonthChange={setMonth}
                                onYearChange={setYear}
                                title="รายงานภาษีซื้อ"
                            />
                        </div>
                        <div className="w-full print:w-full print:max-w-full print:overflow-x-visible print:table-fixed">
                            <VatPurchaseReportTable
                                data={purchasesForTable}
                                sumAmount={sumPurchasesExVat}
                                sumVat={sumPurchasesVat}
                                sumTotal={sumPurchasesTotal}
                                companyProfile={companyProfile}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main UI (screen only) */}
            <section className="w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4 md:p-8 flex flex-col items-center print:bg-white print:shadow-none print:p-0 print:rounded-none">
                {/* Screen-only header */}
                <div className="print:hidden w-full">
                    <ReportHeader
                        month={month}
                        year={year}
                        monthOptions={monthOptions}
                        yearOptions={yearOptions}
                        onMonthChange={setMonth}
                        onYearChange={setYear}
                        title="รายงานสรุปภาษีมูลค่าเพิ่ม (ภ.พ.30)"
                    />
                    <div className="flex flex-col md:flex-row gap-4 w-full mb-6">
                        <div className="flex-1 bg-blue-50 dark:bg-blue-900 rounded-lg p-4 flex flex-col items-center shadow">
                            <div className="text-gray-600 dark:text-gray-200">ภาษีขาย (Output VAT)</div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{formatMoney(sumSalesVat)}</div>
                        </div>
                        <div className="flex-1 bg-green-50 dark:bg-green-900 rounded-lg p-4 flex flex-col items-center shadow">
                            <div className="text-gray-600 dark:text-gray-200">ภาษีซื้อ (Input VAT)</div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-200">{formatMoney(sumPurchasesVat)}</div>
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow">
                            <div className="text-gray-600 dark:text-gray-200">ภาษีมูลค่าเพิ่มสุทธิ</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {formatMoney(netVat)}
                                <span className={`text-xs px-2 py-1 rounded text-white ${netBadgeColor}`}>{netLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Tabs (screen only) */}
                <div className="w-full flex flex-col md:flex-row gap-2 mb-4 print:hidden">
                    <button
                        className={`flex-1 py-2 rounded-t-lg md:rounded-t-none md:rounded-l-lg text-center font-semibold ${tab === 'sales' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        onClick={() => setTab('sales')}
                    >
                        ภาษีขาย
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-t-lg md:rounded-t-none md:rounded-r-lg text-center font-semibold ${tab === 'purchases' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        onClick={() => setTab('purchases')}
                    >
                        ภาษีซื้อ
                    </button>
                </div>
                {/* Screen: tabbed table */}
                <div className="w-full print:hidden">
                    {selectedRow ? (
                        <div className="w-full max-w-full">
                            <VatBreadcrumb
                                type={tab === 'sales' ? 'sale' : 'purchase'}
                                edit={edit}
                                onBack={handleBack}
                            />
                            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 sm:p-6 w-full">
                                {edit ? (
                                    <ReceiptEditForm
                                        systemGenerated={!!editForm?.systemGenerated}
                                        initialValues={editForm}
                                        onSubmit={async () => { setSelectedRow(null); setEdit(false); }}
                                        onCancel={handleBack}
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
                    ) : loading ? (
                        <div className="text-center text-gray-400 py-8">กำลังโหลดข้อมูล...</div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : tab === 'sales' ? (
                        <VatSaleReportTable
                            data={salesForTable}
                            sumExVat={sumSalesExVat}
                            sumVat={sumSalesVat}
                            sumTotal={sumSalesTotal}
                            onRowAction={handleRowAction}
                        />
                    ) : (
                        <VatPurchaseReportTable
                            data={purchasesForTable}
                            sumAmount={sumPurchasesExVat}
                            sumVat={sumPurchasesVat}
                            sumTotal={sumPurchasesTotal}
                            companyProfile={companyProfile}
                            onRowAction={handleRowAction}
                        />
                    )}
                </div>
            </section>
        </PrintWrapper>
    );
};

export default VatSummary;