
import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { formatMoney } from "../utils/utils";

export type TrialBalanceChartData = {
  revenue: number;
  expense: number;
  cost: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashIn: number;
  cashOut: number;
  endingCash: number;
  netProfit: number;
};

interface Props {
  data: TrialBalanceChartData;
}

const COLORS = ["#2563eb", "#22c55e", "#f59e42"];
const POSITION_COLORS = ["#2563eb", "#f59e42", "#22c55e"];
const CASHFLOW_COLORS = ["#2563eb", "#f59e42", "#22c55e"];

export const TrialBalanceChart: React.FC<Props> = ({ data }) => {
  // Income/Expense/Cost chart
  const chartData = [
    { name: "รายได้", value: data.revenue },
    { name: "ค่าใช้จ่าย", value: data.expense },
    { name: "ต้นทุน", value: data.cost },
  ].filter(item => item.value !== 0);

  // Financial Position chart
  const positionData = [
    { name: "สินทรัพย์", value: data.assets },
    { name: "หนี้สิน", value: data.liabilities },
    { name: "ส่วนของผู้ถือหุ้น", value: data.equity },
  ].filter(item => item.value !== 0);

  // Cash Flow chart
  const cashFlowData = [
    { name: "รับเงินสด/โอน", value: data.cashIn },
    { name: "จ่ายเงินสด/โอน", value: data.cashOut },
    { name: "เงินสดคงเหลือ", value: data.endingCash },
  ];

  // Only render if at least one value is non-zero for each chart
  const showIncomeChart = chartData.length > 0;
  const showPositionChart = positionData.length > 0;
  const showCashFlowChart = data.cashIn !== 0 || data.cashOut !== 0 || data.endingCash !== 0;

  // Collect visible sections
  const sections = [];
  if (showIncomeChart) {
    sections.push(
      <div key="income" className="flex flex-col items-center p-4 rounded-lg shadow">
        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">สัดส่วนรายได้/ค่าใช้จ่าย/ต้นทุน</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${formatMoney(value)}`}
            >
              {chartData.map((entry, idx) => (
                entry.value !== 0 ? <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} /> : null
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatMoney(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (showPositionChart) {
    sections.push(
      <div key="position" className="flex flex-col items-center p-4 rounded-lg shadow">
        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">สัดส่วนสินทรัพย์/หนี้สิน/ส่วนของผู้ถือหุ้น</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={positionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${formatMoney(value)}`}
            >
              {positionData.map((entry, idx) => (
                entry.value !== 0 ? <Cell key={`cell-pos-${idx}`} fill={POSITION_COLORS[idx % POSITION_COLORS.length]} /> : null
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatMoney(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (showCashFlowChart) {
    sections.push(
      <div key="cashflow" className="flex flex-col items-center p-4 rounded-lg shadow">
        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">ภาพรวมกระแสเงินสด</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={cashFlowData} margin={{ left: 32, right: 16 }}>
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, 'auto']}
              allowDataOverflow={false}
              width={80}
              tickFormatter={(value) => {
                if (typeof value !== 'number') return '';
                if (Math.abs(value) >= 1_000_000) return (value / 1_000_000) + 'M';
                if (Math.abs(value) >= 1_000) return (value / 1_000) + 'K';
                return '';
              }}
            />
            <Tooltip formatter={(value: number) => formatMoney(value)} />
            <Bar dataKey="value" name="กระแสเงินสด">
              {cashFlowData.map((entry, idx) => (
                <Cell key={`bar-cash-cell-${idx}`} fill={CASHFLOW_COLORS[idx % CASHFLOW_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  // Net Profit KPI always shown
  // Net Profit KPI and comparison
  const operatingCashFlow = typeof data.cashIn === 'number' && typeof data.cashOut === 'number' ? data.cashIn - data.cashOut : 0;
  const diff = data.netProfit - operatingCashFlow;
  sections.push(
    <div key="netprofit" className="flex flex-col items-center p-4 rounded-lg shadow w-full">
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg shadow p-6 flex flex-col items-center w-full mb-4">
        <h4 className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-200">กำไรสุทธิ</h4>
        <div className={`text-3xl font-bold ${data.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatMoney(data.netProfit)}</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-green-900 dark:via-blue-900 dark:to-neutral-900 rounded-lg shadow p-6 flex flex-col items-center w-full">
        <h4 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <span>เปรียบเทียบ กำไรสุทธิ กับ กระแสเงินสดจากการดำเนินงาน</span>
          <span className="inline-block text-xl">🔍</span>
        </h4>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center mb-4 w-full">
          <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-800 w-full md:w-auto">
            <span className="text-xs text-gray-500 mb-1">กำไรสุทธิ</span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-200">{formatMoney(data.netProfit)}</span>
          </div>
          <span className="text-2xl font-bold text-gray-400 hidden md:inline">⇄</span>
          <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-green-100 dark:bg-green-800 w-full md:w-auto">
            <span className="text-xs text-gray-500 mb-1">กระแสเงินสดจากการดำเนินงาน</span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">{formatMoney(operatingCashFlow)}</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 text-base text-gray-700 dark:text-gray-200">
          <span>ส่วนต่าง:</span>
          <span className={`font-bold ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatMoney(diff)}</span>
          {diff >= 0 ? (
            <span className="ml-2 text-green-600 dark:text-green-400">▲</span>
          ) : (
            <span className="ml-2 text-red-600 dark:text-red-400">▼</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      {sections}
    </div>
  );
}
