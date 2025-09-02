import React, { useEffect, useState } from "react";
import { formatMoney } from "../utils/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface StockMovement {
    product: string;
    date: string;
    type: string;
    balanceQty: number;
    balanceAvgCost: number;
    balanceTotal: number;
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

const fetchStockMovements = async (): Promise<StockMovement[]> => {
    const res = await fetch("http://localhost:3000/api/stock-movement?month=08&year=2025");
    if (!res.ok) throw new Error("Failed to fetch stock movements");
    return res.json();
};

const StockOverview: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summaries, setSummaries] = useState<ProductSummary[]>([]);

    useEffect(() => {
        fetchStockMovements()
            .then((data) => {
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
                        balanceTotal: last.balanceTotal,
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
    }, []);

    if (loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

    // Summary cards
    const totalProducts = summaries.length;
    const totalQty = summaries.reduce((sum, s) => sum + Number(s.balanceQty), 0);
    const totalValue = summaries.reduce((sum, s) => sum + Number(s.balanceTotal), 0);

    // Top 5 products by sales
    const topProducts = [...summaries].sort((a, b) => b.salesQty - a.salesQty).slice(0, 5);
    const top3 = topProducts.slice(0, 3);

    // Get first day of the month from the API query
    const month = "08";
    const year = "2025";
    const firstDay = `${year}-${month}-01`;

    // Collect all dates from top3 products
    const allDatesSet = new Set<string>([firstDay]);
    top3.forEach(prod => prod.dailyTrend.forEach(d => allDatesSet.add(d.date)));
    const allDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

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

    return (
        <div className="w-full max-w-5xl mx-auto py-8">
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

            {/* Table */}
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
    );
};

export default StockOverview;
