

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
            <div className="w-full flex justify-end mt-2 mb-2">
                <button
                    onClick={handlePrintPP30}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow"
                >
                    พิมพ์แบบภพ.30
                </button>
            </div>
            <div className="w-full mb-4 print:hidden">
                {!pp30Loading && (!pp30Log ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="text-yellow-800 font-medium">ยังไม่ได้ยื่นแบบ ภ.พ.30 สำหรับเดือนนี้</div>
                        <button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded shadow"
                            onClick={async () => {
                                // Log PP30
                                const pp30Log = {
                                    month,
                                    year,
                                    status: 'submitted',
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
                                const rule = Array.isArray(rules.vat_closing) ? rules.vat_closing : [];
                                // Map rule to entries (handle both debit and credit in same rule)
                                const entries: any[] = [];
                                const getAcc = (num: string | undefined) => {
                                    if (!num) return '';
                                    const acc = (rules.accounts || []).find((a: any) => a.accountNumber === num);
                                    return acc ? `${acc.accountNumber}-${acc.accountName}` : num;
                                };
                                // Calculate correct totals for each account
                                // 2200: debit sumSalesVat
                                // 1200: credit sumPurchasesVat
                                // 2190: credit sumSalesVat - sumPurchasesVat
                                const acc2200 = getAcc('2200');
                                const acc1200 = getAcc('1200');
                                const acc2190 = getAcc('2190');
                                // If input VAT > output VAT, credit เครดิตภาษี (e.g., 1201)
                                if (sumPurchasesVat > sumSalesVat) {
                                    const accCreditVat = getAcc('1201');
                                    entries.push({
                                        account: acc2200,
                                        description: 'ปิด VAT ขาย',
                                        debit: sumSalesVat,
                                        credit: 0
                                    });
                                    entries.push({
                                        account: acc1200,
                                        description: 'ปิด VAT ซื้อ',
                                        debit: 0,
                                        credit: sumPurchasesVat
                                    });
                                    entries.push({
                                        account: accCreditVat,
                                        description: 'เครดิตภาษี (VAT ขาย < VAT ซื้อ)',
                                        debit: 0,
                                        credit: sumPurchasesVat - sumSalesVat
                                    });
                                } else {
                                    entries.push({
                                        account: acc2200,
                                        description: 'ปิด VAT ขาย',
                                        debit: sumSalesVat,
                                        credit: 0
                                    });
                                    entries.push({
                                        account: acc1200,
                                        description: 'ปิด VAT ซื้อ',
                                        debit: 0,
                                        credit: sumPurchasesVat
                                    });
                                    entries.push({
                                        account: acc2190,
                                        description: 'ภาษีมูลค่าเพิ่มค้างจ่าย',
                                        debit: 0,
                                        credit: sumSalesVat - sumPurchasesVat
                                    });
                                }
                                // Show journalTypeLabel for vat_closing (optional: you can display this in UI as needed)
                                const vatClosingLabel = journalTypeLabels["vat_closing"] || "ปิดบัญชีภาษีมูลค่าเพิ่ม";
                                const doc = {
                                    type: 'vat_closing',
                                    category: vatClosingLabel,
                                    date: now.toISOString().slice(0, 10),
                                    issuedAt: now.toISOString(),
                                    uploadedAt: now.toISOString(),
                                    receipt_no: `VATC-${year}${month}`,
                                    vendor: companyProfile?.company_name || '',
                                    vendor_tax_id: companyProfile?.tax_id || '',
                                    buyer_name: '',
                                    buyer_tax_id: '',
                                    notes: vatClosingLabel,
                                    systemGenerated: true,
                                    products: entries.map((e: any) => ({
                                        name: e.account,
                                        quantity: "1",
                                        pricePerItem: (e.debit > 0 ? e.debit : e.credit).toString(),
                                        price: (e.debit > 0 ? e.debit : e.credit).toString(),
                                        description: e.description,
                                        weight: "0"
                                    })),
                                    entries,
                                    grand_total: Math.abs(netVat),
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
                ) : (pp30Log.status !== 'paid' && pp30Log.amount > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="text-blue-800 font-medium">ยื่นแบบแล้ว รอชำระภาษี (ยอดสุทธิ {formatMoney(pp30Log.amount)} บาท)</div>
                        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow" onClick={() => {/* TODO: mark as paid */ }}>
                            ชำระภาษีแล้ว
                        </button>
                    </div>
                ) : null))}
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
                        <h2 className="text-lg font-semibold mb-2">ภาษีขาย (Output VAT)</h2>
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
                        <h2 className="text-lg font-semibold mb-2">ภาษีซื้อ (Input VAT)</h2>
                        <div className="w-full print:w-full print:max-w-full print:overflow-x-visible print:table-fixed">
                            <VatPurchaseReportTable
                                data={purchasesForTable}
                                sumAmount={sumPurchasesExVat}
                                sumVat={sumPurchasesVat}
                                sumTotal={sumPurchasesTotal}
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
                            onRowAction={handleRowAction}
                        />
                    )}
                </div>
            </section>
        </PrintWrapper>
    );
};

export default VatSummary;