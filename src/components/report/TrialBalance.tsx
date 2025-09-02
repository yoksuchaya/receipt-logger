import React, { useState, useEffect } from "react";
import ReportHeader from "../common/ReportHeader";
import PrintWrapper from "../layout/PrintWrapper";
import MonthYearSelector from "../common/MonthYearSelector";
import { TrialBalanceChart } from "./TrialBalanceChart";

type TrialBalanceRow = {
  accountNumber: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  debit: number;
  credit: number;
  closingDebit: number;
  closingCredit: number;
};

type Props = {
  month?: string;
  year?: string;
  data?: TrialBalanceRow[];
};

function formatNumber(num: number) {
  return num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: (now.getMonth() + 1).toString().padStart(2, "0"),
    year: now.getFullYear().toString(),
  };
};

const TrialBalance: React.FC<Props> = ({ month: propMonth, year: propYear, data: propData }) => {
  const { month: initialMonth, year: initialYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(propMonth || initialMonth);
  const [year, setYear] = useState(propYear || initialYear);
  const [data, setData] = useState<TrialBalanceRow[]>(propData ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/trial-balance?month=${year}-${month}`)
      .then(res => {
        if (!res.ok) throw new Error("โหลดข้อมูลงบทดลองล้มเหลว");
        return res.json();
      })
      .then(json => {
        setData(json.trialBalance || []);
      })
      .catch(e => setError(e.message || "เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, [month, year]);

  // Calculate totals for each column, default data to [] if undefined
  const totals = (data ?? []).reduce(
    (acc, row) => {
      acc.openingDebit += row.openingDebit;
      acc.openingCredit += row.openingCredit;
      acc.debit += row.debit;
      acc.credit += row.credit;
      acc.closingDebit += row.closingDebit;
      acc.closingCredit += row.closingCredit;
      return acc;
    },
    {
      openingDebit: 0,
      openingCredit: 0,
      debit: 0,
      credit: 0,
      closingDebit: 0,
      closingCredit: 0,
    }
  );


  // Extract revenue, expense, cost from trial balance data
  const revenue = (data ?? []).filter(row => row.accountNumber.startsWith("4"))
    .reduce((sum, row) => sum + row.credit, 0);
  const expense = (data ?? []).filter(row => row.accountNumber.startsWith("5") && row.accountNumber !== "5000")
    .reduce((sum, row) => sum + row.debit, 0);
  const cost = (data ?? []).filter(row => row.accountNumber === "5000")
    .reduce((sum, row) => sum + row.debit, 0);

  // Financial Position: Assets, Liabilities, Equity
  const assets = (data ?? []).filter(row => row.accountNumber.startsWith("1"))
    .reduce((sum, row) => sum + row.closingDebit - row.closingCredit, 0);
  const liabilities = (data ?? []).filter(row => row.accountNumber.startsWith("2"))
    .reduce((sum, row) => sum + row.closingCredit - row.closingDebit, 0);
  const equity = (data ?? []).filter(row => row.accountNumber.startsWith("3"))
    .reduce((sum, row) => sum + row.closingCredit - row.closingDebit, 0);

  // Cash Flow Overview
  // Cash In: debit to accounts "1000"/"1010" from revenue
  const cashIn = (data ?? []).filter(row => ["1000", "1010"].includes(row.accountNumber))
    .reduce((sum, row) => sum + row.debit, 0);
  // Cash Out: credit from accounts "1000"/"1010" to expenses or liabilities
  const cashOut = (data ?? []).filter(row => ["1000", "1010"].includes(row.accountNumber))
    .reduce((sum, row) => sum + row.credit, 0);
  // Ending Cash: opening balance + cash in – cash out
  const openingCash = (data ?? []).filter(row => ["1000", "1010"].includes(row.accountNumber))
    .reduce((sum, row) => sum + row.openingDebit - row.openingCredit, 0);
  const endingCash = openingCash + cashIn - cashOut;

  // Net Profit: Revenue – (Cost of Goods Sold + Operating Expenses)
  const netProfit = revenue - (cost + expense);

  return (
    <>
      <MonthYearSelector month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
      <TrialBalanceChart
        data={{
          revenue,
          expense,
          cost,
          assets,
          liabilities,
          equity,
          cashIn,
          cashOut,
          endingCash,
          netProfit,
        }}
      />
      <PrintWrapper printLabel="รายงานงบทดลอง (ประจำเดือน)" printButtonLabel="พิมพ์รายงานงบทดลอง (ประจำเดือน)">
        <div className="w-full flex flex-col items-center py-8">
          <div className="mb-4 w-full flex justify-center hidden print-block">
            <ReportHeader
              month={month}
              year={year}
              onMonthChange={setMonth}
              onYearChange={setYear}
              title="รายงานงบทดลอง (ประจำเดือน)"
            />
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-8">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-900">
                <thead>
                  <tr className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200">
                    <th className="px-2 py-2 border-b">เลขที่บัญชี</th>
                    <th className="px-2 py-2 border-b">ชื่อบัญชี</th>
                    <th className="px-2 py-2 border-b">ยอดยกมา - เดบิต</th>
                    <th className="px-2 py-2 border-b">ยอดยกมา - เครดิต</th>
                    <th className="px-2 py-2 border-b">เดบิต</th>
                    <th className="px-2 py-2 border-b">เครดิต</th>
                    <th className="px-2 py-2 border-b">ยอดยกไป - เดบิต</th>
                    <th className="px-2 py-2 border-b">ยอดยกไป - เครดิต</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">ยังไม่มีข้อมูลงบทดลอง</td>
                    </tr>
                  ) : (
                    (data ?? []).map((row) => (
                      <tr key={row.accountNumber} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="px-2 py-2 text-center whitespace-nowrap">{row.accountNumber}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{row.accountName}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.openingDebit)}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.openingCredit)}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.debit)}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.credit)}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.closingDebit)}</td>
                        <td className="px-2 py-2 text-right">{formatNumber(row.closingCredit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-neutral-800 font-bold text-gray-900 dark:text-white">
                    <td className="px-2 py-2 text-center" colSpan={2}>รวม</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.openingDebit)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.openingCredit)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.debit)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.credit)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.closingDebit)}</td>
                    <td className="px-2 py-2 text-right">{formatNumber(totals.closingCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </PrintWrapper>
    </>
  );
};

export default TrialBalance;
