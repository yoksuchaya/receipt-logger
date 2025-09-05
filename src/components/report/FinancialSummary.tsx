import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatMoney } from "../utils/utils";
import YearSelector from '../common/YearSelector';

interface TrialBalanceItem {
    accountNumber: string;
    accountName: string;
    openingDebit: number;
    openingCredit: number;
    debit: number;
    credit: number;
    closingDebit: number;
    closingCredit: number;
}

interface ApiResponse {
    period: string;
    trialBalance: TrialBalanceItem[];
}

function summarize(trialBalance: TrialBalanceItem[], accountTypeMap: Record<string, string>) {
    let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
    const assetBreakdown: { name: string; value: number }[] = [];
    const expenseBreakdown: { name: string; value: number }[] = [];

    trialBalance.forEach(item => {
        const type = accountTypeMap[item.accountNumber];
        const value = item.closingDebit - item.closingCredit;
        if (type === "asset") {
            assets += value;
            assetBreakdown.push({ name: item.accountName, value });
        } else if (type === "liability") {
            liabilities += item.closingCredit - item.closingDebit;
        } else if (type === "equity") {
            equity += item.closingCredit - item.closingDebit;
        } else if (type === "revenue") {
            revenue += item.closingCredit - item.closingDebit;
        } else if (type === "expense") {
            expenses += value;
            expenseBreakdown.push({ name: item.accountName, value });
        }
    });

    const netProfit = revenue - expenses;

    return {
        assets,
        liabilities,
        equity,
        revenue,
        expenses,
        netProfit,
        assetBreakdown,
        expenseBreakdown,
    };
}

const FinancialSummary: React.FC = () => {
    const currentYear = new Date().getFullYear().toString();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [accountTypeMap, setAccountTypeMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            fetch(`/api/trial-balance?period=${year}`).then(res => {
                if (!res.ok) throw new Error("Failed to fetch trial balance");
                return res.json();
            }),
            fetch(`/api/account-chart`).then(res => {
                if (!res.ok) throw new Error("Failed to fetch account chart");
                return res.json();
            })
        ])
            .then(([trialBalanceData, accountChartData]) => {
                setData(trialBalanceData);
                // Build account type map
                const map: Record<string, string> = {};
                if (accountChartData.accounts) {
                    accountChartData.accounts.forEach((acc: any) => {
                        map[acc.accountNumber] = acc.type;
                    });
                }
                setAccountTypeMap(map);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [year]);

    const summary = data && Object.keys(accountTypeMap).length > 0 ? summarize(data.trialBalance, accountTypeMap) : null;

    // Pie chart for assets
    const pieData = {
        labels: summary?.assetBreakdown.map(a => a.name) || [],
        datasets: [
            {
                data: summary?.assetBreakdown.map(a => a.value) || [],
                backgroundColor: [
                    '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#38bdf8', '#facc15', '#4ade80', '#c084fc'
                ],
            },
        ],
    };

    // Bar chart for liabilities vs equity
    const barLEData = {
        labels: ["Liabilities", "Equity"],
        datasets: [
            {
                label: "Amount",
                data: [summary?.liabilities || 0, summary?.equity || 0],
                backgroundColor: ['#f87171', '#34d399'],
            },
        ],
    };

    // Bar chart for revenue vs expenses
    const barREData = {
        labels: ["Revenue", "COGS/Expenses"],
        datasets: [
            {
                label: "Amount",
                data: [summary?.revenue || 0, summary?.expenses || 0],
                backgroundColor: ['#fbbf24', '#60a5fa'],
            },
        ],
    };

    return (
        <div className="w-full mx-auto p-4">
            <div className="flex items-center gap-4 mb-6 justify-center">
                <span className="font-semibold text-lg">ปีงบประมาณ:</span>
                <YearSelector year={year} onYearChange={setYear} />
            </div>
            {loading ? (
                <div className="space-y-4">
                    <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
                    <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
                </div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : summary ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded shadow p-4">
                            <div className="font-semibold mb-2">สัดส่วนสินทรัพย์</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={summary.assetBreakdown}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, value }) => `${name}: ${formatMoney(value)}`}
                                    >
                                        {summary.assetBreakdown.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#38bdf8", "#facc15", "#4ade80", "#c084fc"][idx % 10]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatMoney(value as number)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded shadow p-4">
                            <div className="font-semibold mb-2">หนี้สิน vs ส่วนของผู้ถือหุ้น</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart margin={{ left: 32, right: 16 }} data={[{ name: "หนี้สิน", value: summary.liabilities }, { name: "ส่วนของผู้ถือหุ้น", value: summary.equity }]}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatMoney(value as number)} />
                                    {/* <Legend /> */}
                                    <Bar dataKey="value" fill="#34d399" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 rounded shadow p-4">
                            <div className="font-semibold mb-2">สินทรัพย์รวม</div>
                            <div className="text-2xl font-bold text-blue-600">{formatMoney(summary.assets)}</div>
                        </div>
                        <div className="bg-red-50 rounded shadow p-4">
                            <div className="font-semibold mb-2">หนี้สินรวม</div>
                            <div className="text-2xl font-bold text-red-600">{formatMoney(summary.liabilities)}</div>
                        </div>
                        <div className="bg-green-50 rounded shadow p-4">
                            <div className="font-semibold mb-2">ส่วนของผู้ถือหุ้นรวม</div>
                            <div className="text-2xl font-bold text-green-600">{formatMoney(summary.equity)}</div>
                        </div>
                        <div className="bg-yellow-50 rounded shadow p-4">
                            <div className="font-semibold mb-2">กำไร/ขาดทุนสุทธิ</div>
                            <div className="text-2xl font-bold text-yellow-600">{formatMoney(summary.netProfit)}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded shadow p-4">
                        <div className="font-semibold mb-2">รายได้ vs ต้นทุน/ค่าใช้จ่าย</div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={[{ name: "รายได้", value: summary.revenue }, { name: "ต้นทุน/ค่าใช้จ่าย", value: summary.expenses }]}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatMoney(value as number)} />
                                {/* <Legend /> */}
                                <Bar dataKey="value" fill="#60a5fa" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default FinancialSummary;
