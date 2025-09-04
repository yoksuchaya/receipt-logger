import React, { useEffect, useState } from "react";
import MonthYearSelector from "../common/MonthYearSelector";
import { formatMoney } from "../utils/utils";
import PrintWrapper from "../layout/PrintWrapper";
import ReportHeader from "../common/ReportHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FunnelIcon } from '@heroicons/react/24/outline';

interface StockMovement {
    product: string;
    date: string;
    type: string;
    balanceQty: number;
    balanceAvgCost: number;
    total: number;
    qty: number;
}

interface ProductSummary {
    product: string;
    balanceQty: number;
    balanceAvgCost: number;
    balanceTotal: number;
    salesQty: number;
    purchaseQty: number;
    openingQty: number;
    dailyTrend: { date: string; balanceQty: number }[];
}

const fetchStockMovements = async (month: string, year: string): Promise<StockMovement[]> => {
    const res = await fetch(`/api/stock-movement?month=${month}&year=${year}`);
    if (!res.ok) throw new Error("Failed to fetch stock movements");
    return res.json();
};

const getCurrentMonthYear = () => {
    const now = new Date();
    return {
        month: (now.getMonth() + 1).toString().padStart(2, "0"),
        year: now.getFullYear().toString(),
    };
};

const StockOverview: React.FC = () => {
    // Print modal state
    const [isPrintModalOpen, setPrintModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("sale");
    const [printProducts, setPrintProducts] = useState<string[]>([]);
    const [showFilterPopover, setShowFilterPopover] = useState(false);

    // Print handler
    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 200);
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summaries, setSummaries] = useState<ProductSummary[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [{ month, year }, setMonthYear] = useState(getCurrentMonthYear());

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchStockMovements(month, year)
            .then((data) => {
                setMovements(data);
                // Group by product
                const grouped: Record<string, StockMovement[]> = {};
                data.forEach((m) => {
                    if (!grouped[m.product]) grouped[m.product] = [];
                    grouped[m.product].push(m);
                });
                const summaries: ProductSummary[] = Object.entries(grouped).map(([product, movements]) => {
                    const sorted = movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const last = sorted[sorted.length - 1];
                    const salesQty = movements.filter((m) => m.type === "sale").reduce((sum, m) => sum + Number(m.qty), 0);
                    const purchaseQty = movements.filter((m) => m.type === "purchase").reduce((sum, m) => sum + Number(m.qty), 0);
                    // Find opening qty
                    const openingMovement = sorted.find((m) => m.type === "opening");
                    const openingQty = openingMovement ? openingMovement.balanceQty : 0;
                    // Deduplicate dates, keep only last movement per day
                    const trendByDate: Record<string, StockMovement> = {};
                    sorted.forEach((m) => {
                        if (m.date) {
                            const day = m.date.split("T")[0];
                            trendByDate[day] = m;
                        }
                    });
                    const dailyTrend = Object.entries(trendByDate)
                        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                        .map(([date, m]) => ({ date, balanceQty: m.balanceQty }));
                    return {
                        product,
                        balanceQty: last.balanceQty,
                        balanceAvgCost: last.balanceAvgCost,
                        balanceTotal: last.total,
                        salesQty,
                        purchaseQty,
                        openingQty,
                        dailyTrend,
                    };
                });
                setSummaries(summaries);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [month, year]);

    if (loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

    // Summary cards
    const totalProducts = summaries.length;
    const totalQty = summaries.reduce((sum, s) => sum + Number(s.balanceQty), 0);
    const totalValue = summaries.reduce((sum, s) => sum + Number(s.balanceTotal), 0);

    // Top 5 products by sales
    const topProducts = [...summaries].sort((a, b) => b.salesQty - a.salesQty).slice(0, 5);
    const top3 = topProducts.slice(0, 3);
    // Get all product names for filter
    const allProductNames = Array.from(new Set(summaries.map(s => s.product)));

    // Generate all days in the month
    const getAllDaysInMonth = (year: string, month: string) => {
        const y = Number(year);
        const m = Number(month) - 1; // JS months are 0-based
        const today = new Date();
        let lastDay: number;
        if (y === today.getFullYear() && m === today.getMonth()) {
            lastDay = today.getDate();
        } else {
            lastDay = new Date(y, m + 1, 0).getDate();
        }
        const days: string[] = [];
        for (let d = 1; d <= lastDay; d++) {
            const dayStr = `${y}-${(m + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
            days.push(dayStr);
        }
        return days;
    };

    const allDates = getAllDaysInMonth(year, month);

    // Use openingQty for each product to initialize prevQtys
    const prevQtys: number[] = top3.map(prod => prod.openingQty);
    const mergedTrend = allDates.map((date, i) => {
        const entry: Record<string, any> = { date };
        top3.forEach((prod, idx) => {
            const found = prod.dailyTrend.find((d) => d.date === date);
            if (found) {
                entry[`balanceQty${idx + 1}`] = found.balanceQty;
                prevQtys[idx] = found.balanceQty;
            } else {
                // For first day, use openingQty
                entry[`balanceQty${idx + 1}`] = i === 0 ? prod.openingQty : prevQtys[idx];
            }
        });
        return entry;
    });

    // Prepare print rows: flatten all movements, filter by type/products
    const printRows: StockMovement[] = [];
    summaries.forEach(s => {
        if (printProducts.length === 0 || printProducts.includes(s.product)) {
            // Find all movements for this product
            // For print, you may want to keep the original movements
            // But here, we only have summary, so use dailyTrend for balance, and sales/purchase for qty
            // If you want to show all movements, you need to fetch and keep the original data
        }
    });
    // For now, use summaries as rows, but ideally you want to use the original StockMovement[]

    return (
        <div className="w-full max-w-5xl mx-auto py-8">
            {/* Main Content (hide on print) */}
            <div className="print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                    <h2 className="text-xl font-bold">สรุปภาพรวมสต็อกสินค้า</h2>
                    <div className="flex gap-2 items-center">
                        <MonthYearSelector
                            month={month}
                            year={year}
                            onMonthChange={m => setMonthYear({ month: m, year })}
                            onYearChange={y => setMonthYear({ month, year: y })}
                        />
                    </div>
                </div>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow">
                        <div className="text-sm">จำนวนสินค้า</div>
                        <div className="text-xl font-bold">{totalProducts}</div>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow">
                        <div className="text-sm">จำนวนคงเหลือรวม</div>
                        <div className="text-xl font-bold">{formatMoney(totalQty)} กรัม</div>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center shadow">
                        <div className="text-sm">มูลค่าสินค้ารวม</div>
                        <div className="text-xl font-bold">฿ {formatMoney(totalValue)}</div>
                    </div>
                </div>
                {/* Overview Stock Table */}
                <div className="w-full mb-8">
                    <table className="min-w-full text-xs md:text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-neutral-800">
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800">สินค้า</th>
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-right">จำนวนคงเหลือ (กรัม)</th>
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-right">ต้นทุนเฉลี่ย (ต่อกรัม)</th>
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-right">มูลค่าคงเหลือ (บาท)</th>
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-right">ขายออก (กรัม)</th>
                                <th className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-right">ซื้อเข้า (กรัม)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaries.map((s) => (
                                <tr className="" key={s.product}>
                                    <td className="border border-gray-300 px-2 py-1 text-s">{s.product}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-s text-right">{formatMoney(s.balanceQty)}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-s text-right">{formatMoney(s.balanceAvgCost)}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-s text-right">{formatMoney(s.balanceTotal)}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-s text-right">{formatMoney(s.salesQty)}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-s text-right">{formatMoney(s.purchaseQty)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bar Chart: Top 5 products by sales */}
                    <div className="p-4 rounded-lg shadow">
                        <div className="text-sm">Top 5 สินค้าขายดี</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topProducts}>
                                <XAxis dataKey="product" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="salesQty" fill="#38bdf8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Multi-line Chart: Daily balanceQty for top 3 products */}
                    <div className="p-4 rounded-lg shadow">
                        <div className="text-sm">แนวโน้มจำนวนคงเหลือ (Top 3 สินค้าขายดี)</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mergedTrend}>
                                <XAxis
                                    dataKey="date"
                                    type="category"
                                    tickFormatter={(date) => {
                                        if (!date) return "";
                                        const d = new Date(date);
                                        if (!isNaN(d.getTime())) {
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }
                                        return String(date);
                                    }}
                                    interval={mergedTrend.length > 20 ? Math.ceil(mergedTrend.length / 7) : 0}
                                    minTickGap={8}
                                />
                                <YAxis />
                                <Tooltip />
                                {top3.map((prod, idx) => (
                                    <Line
                                        key={prod.product}
                                        dataKey={`balanceQty${idx + 1}`}
                                        name={prod.product}
                                        stroke={["#34d399", "#38bdf8", "#f59e42"][idx]}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Print Filters (on screen) */}
            <div className="flex flex-col md:flex-row gap-4 items-center mt-8 mb-4 print:hidden">
                {/* Tabs for sale/purchase */}
                <div className="w-full flex flex-col md:flex-row gap-2 mb-4">
                    <button
                        className={`flex-1 py-2 rounded-t-lg md:rounded-t-none md:rounded-l-lg text-center font-semibold ${activeTab === 'sale' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        onClick={() => setActiveTab('sale')}
                    >
                        ขายออก
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-t-lg md:rounded-t-none md:rounded-r-lg text-center font-semibold ${activeTab === 'purchase' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                        onClick={() => setActiveTab('purchase')}
                    >
                        ซื้อเข้า
                    </button>
                    <div className="relative ml-6 flex items-center h-full">
                        <button
                            className="flex items-center gap-1 px-3 py-2 border rounded bg-white shadow hover:bg-gray-50 h-10 relative"
                            style={{ minHeight: '40px' }}
                            onClick={() => setShowFilterPopover(v => !v)}
                        >
                            <FunnelIcon className={`w-5 h-5 ${printProducts.length > 0 ? 'text-blue-500' : 'text-gray-800'}`} />
                            <span>กรองสินค้า</span>
                            {printProducts.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 shadow">{printProducts.length}</span>
                            )}
                        </button>
                        {showFilterPopover && (
                            <div className="absolute left-0 mt-2 z-10 bg-white border rounded shadow-lg p-4 min-w-[220px]">
                                <div className="mb-2 font-medium">เลือกสินค้า</div>
                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                    {allProductNames.map(product => (
                                        <label key={product} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={printProducts.includes(product)}
                                                onChange={e => {
                                                    setPrintProducts(prev =>
                                                        e.target.checked
                                                            ? [...prev, product]
                                                            : prev.filter(p => p !== product)
                                                    );
                                                }}
                                            />
                                            <span>{product}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-end mt-4 gap-2">
                                    <button
                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                                        onClick={() => setPrintProducts([])}
                                    >
                                        ล้างทั้งหมด
                                    </button>
                                    <button
                                        className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                                        onClick={() => setShowFilterPopover(false)}
                                    >
                                        ตกลง
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Table (visible on screen and print) */}
            <PrintWrapper>
                <div className="mb-8 print:mb-0 print:block print:bg-white print:shadow-none" id="stock-print-wrapper">
                    <div className="hidden print:block">
                        <ReportHeader
                            month={month}
                            year={year}
                            title={`รายงานสต็อกสินค้า (${activeTab === "sale" ? "ขายออก" : "ซื้อเข้า"})`}
                            subtitle={`สินค้า: ${printProducts.length === 0 || printProducts.length === allProductNames.length
                                ? "ทั้งหมด"
                                : printProducts.join(", ")}`}
                            onMonthChange={() => { }}
                            onYearChange={() => { }}
                        />
                    </div>
                    <table className="min-w-full text-xs md:text-sm border border-gray-300 mt-4 print:mt-0">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-neutral-800">
                                <th className="border border-gray-300 px-2 py-1">วันที่</th>
                                <th className="border border-gray-300 px-2 py-1">สินค้า</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">จำนวน</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">ราคาต่อหน่วย</th>
                                <th className="border border-gray-300 px-2 py-1 text-right">รวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const filtered = movements.filter(m =>
                                    (printProducts.length === 0 || printProducts.includes(m.product)) &&
                                    (activeTab === "sale" ? m.type === "sale" : activeTab === "purchase" ? m.type === "purchase" : true)
                                );
                                if (filtered.length === 0) {
                                    return (
                                        <tr>
                                            <td className="border border-gray-300 px-2 py-1 text-center" colSpan={5}>ยังไม่มีรายการ</td>
                                        </tr>
                                    );
                                }
                                return filtered.map((m, i) => (
                                    <tr key={i}>
                                        <td className="border border-gray-300 px-2 py-1">{m.date}</td>
                                        <td className="border border-gray-300 px-2 py-1">{m.product}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(m.qty)}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(m.balanceAvgCost)}</td>
                                        <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(m.total)}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                        {/* Footer for sum qty and sum balanceTotal */}
                        <tfoot>
                            <tr className="font-bold bg-gray-50 dark:bg-neutral-800">
                                <td className="border border-gray-300 px-2 py-1 text-right" colSpan={2}>รวม</td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    {formatMoney(
                                        movements
                                            .filter(m =>
                                                (printProducts.length === 0 || printProducts.includes(m.product)) &&
                                                (activeTab === "sale" ? m.type === "sale" : activeTab === "purchase" ? m.type === "purchase" : true)
                                            )
                                            .reduce((sum, m) => sum + Number(m.qty), 0)
                                    )}
                                </td>
                                <td className="border border-gray-300 px-2 py-1 text-right"></td>
                                <td className="border border-gray-300 px-2 py-1 text-right">
                                    {formatMoney(
                                        movements
                                            .filter(m =>
                                                (printProducts.length === 0 || printProducts.includes(m.product)) &&
                                                (activeTab === "sale" ? m.type === "sale" : activeTab === "purchase" ? m.type === "purchase" : true)
                                            )
                                            .reduce((sum, m) => sum + Number(m.total), 0)
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </PrintWrapper>
        </div>
    );
};

export default StockOverview;
