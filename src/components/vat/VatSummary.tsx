

import { useState, useEffect } from "react";
import ReportHeader from "../common/ReportHeader";
import { monthOptions, getMonthLabel } from "../utils/monthLabels";
import VatSaleReportTable from "./VatSaleReportTable";
import VatPurchaseReportTable from "./VatPurchaseReportTable";
import PrintWrapper from "../layout/PrintWrapper";
import { formatMoney } from "../utils/utils";
import { VatSale } from "./VatSaleReportTable";
import { VatPurchase } from "./VatPurchaseReportTable";

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
                <div className="w-full flex justify-end mb-4 print:hidden">
                    <button
                        onClick={handlePrintPP30}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded shadow"
                    >
                        พิมพ์แบบภพ.30
                    </button>
                </div>
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
                    {loading ? (
                        <div className="text-center text-gray-400 py-8">กำลังโหลดข้อมูล...</div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : tab === 'sales' ? (
                        <VatSaleReportTable
                            data={salesForTable}
                            sumExVat={sumSalesExVat}
                            sumVat={sumSalesVat}
                            sumTotal={sumSalesTotal}
                        />
                    ) : (
                        <VatPurchaseReportTable
                            data={purchasesForTable}
                            sumAmount={sumPurchasesExVat}
                            sumVat={sumPurchasesVat}
                            sumTotal={sumPurchasesTotal}
                        />
                    )}
                </div>
            </section>
        </PrintWrapper>
    );
};

export default VatSummary;