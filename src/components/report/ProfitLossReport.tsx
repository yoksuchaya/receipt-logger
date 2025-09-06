
import React, { useEffect, useState } from "react";
import PrintWrapper from "../layout/PrintWrapper";
import ReportHeader from "../common/ReportHeader";
import { TrialBalanceItem } from "../types/TrialBalanceItem";

interface Section {
  label: string;
  items: TrialBalanceItem[];
  total: number;
}

function formatNumber(num: number) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function groupAccounts(trialBalance: TrialBalanceItem[]) {
  const revenue = trialBalance.filter(a => a.accountNumber.startsWith("4"));
  const cogs = trialBalance.filter(a => a.accountNumber.startsWith("5") && !a.accountNumber.startsWith("54"));
  const opExp = trialBalance.filter(a => a.accountNumber.startsWith("54"));
  const other = trialBalance.filter(a => a.accountNumber !== "6990" && a.accountNumber.startsWith("6") || a.accountNumber.startsWith("7"));
  const tax = trialBalance.filter(a => a.accountNumber === "6990");

  const sum = (arr: TrialBalanceItem[]) => arr.reduce((acc, a) => acc + (a.credit - a.debit), 0);
  const sumAbs = (arr: TrialBalanceItem[]) => arr.reduce((acc, a) => acc + Math.abs(a.credit - a.debit), 0);

  const revenueTotal = sum(revenue);
  const cogsTotal = sum(cogs);
  const grossProfit = revenueTotal + cogsTotal;
  const opExpTotal = sum(opExp);
  const opProfit = grossProfit - Math.abs(opExpTotal);
  const otherTotal = sum(other);
  const taxTotal = sumAbs(tax);
  const netProfit = opProfit + otherTotal - taxTotal;

  return {
    revenue: { label: "รายได้ (Revenue)", items: revenue, total: revenueTotal },
    cogs: { label: "ต้นทุนขาย (COGS)", items: cogs, total: cogsTotal },
    grossProfit,
    opExp: { label: "ค่าใช้จ่ายในการดำเนินงาน (Operating Expenses)", items: opExp, total: opExpTotal },
    opProfit,
    other: { label: "รายได้/ค่าใช้จ่ายอื่น (Other Income/Expenses)", items: other, total: otherTotal },
    tax: { label: "ภาษี (Tax)", items: tax, total: taxTotal },
    netProfit,
  };
}

interface ProfitLossReportProps {
  year: string;
  trialBalance: TrialBalanceItem[];
  loading: boolean;
  error: string | null;
}

const ProfitLossReport: React.FC<ProfitLossReportProps> = ({ year, trialBalance, loading, error }) => {
  const sections = groupAccounts(trialBalance);

  return (
    <>
      <div className="w-full mx-auto py-8 mt-8 px-8 bg-white rounded-lg shadow-lg border border-gray-100 print:bg-transparent print:shadow-none print:border-0 print:rounded-none">
        <PrintWrapper printLabel="รายงานกำไรขาดทุน (Profit & Loss)">
          <h2 className="text-xl font-bold mb-4 print:hidden">รายงานกำไรขาดทุน (Profit & Loss)</h2>
          {/* Print-only header */}
          <div className="hidden print:block">
            <ReportHeader
              month={"01"}
              year={year}
              onMonthChange={() => { }}
              onYearChange={() => { }}
              title="งบกำไรขาดทุน (Profit & Loss Statement)"
            />
          </div>
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-center py-16 text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm border-separate border-spacing-y-1">
                <tbody>
                  {/* Revenue */}
                  <tr className="font-semibold text-primary bg-muted">
                    <td colSpan={2} className="px-4 py-2 border-t">{sections.revenue.label}</td>
                    <td className="text-right px-4 py-2 border-t">{formatNumber(sections.revenue.total)}</td>
                  </tr>
                  {sections.revenue.items.map((a) => (
                    <tr key={a.accountNumber} className="text-muted-foreground bg-white">
                      <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                      <td className="py-1 align-top">{a.accountName}</td>
                      <td className="text-right px-4 py-1 align-top">{formatNumber(a.credit - a.debit)}</td>
                    </tr>
                  ))}
                  {/* COGS */}
                  <tr className="font-semibold text-primary bg-muted">
                    <td colSpan={2} className="border-t px-4 py-2">{sections.cogs.label}</td>
                    <td className="border-t text-right px-4 py-2">{formatNumber(sections.cogs.total)}</td>
                  </tr>
                  {sections.cogs.items.map((a) => (
                    <tr key={a.accountNumber} className="text-muted-foreground bg-white">
                      <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                      <td className="py-1 align-top">{a.accountName}</td>
                      <td className="text-right px-4 py-1 align-top">{formatNumber(a.credit - a.debit)}</td>
                    </tr>
                  ))}
                  {/* Gross Profit */}
                  <tr className="bg-muted font-bold">
                    <td colSpan={2} className="border-t px-4 py-2">กำไรขั้นต้น (Gross Profit)</td>
                    <td className="border-t text-right px-4 py-2">{formatNumber(sections.grossProfit)}</td>
                  </tr>
                  {/* Operating Expenses */}
                  <tr className="font-semibold text-primary bg-muted">
                    <td colSpan={2} className="border-t px-4 py-2">{sections.opExp.label}</td>
                    <td className="border-t text-right px-4 py-2">{formatNumber(sections.opExp.total)}</td>
                  </tr>
                  {sections.opExp.items.map((a) => (
                    <tr key={a.accountNumber} className="text-muted-foreground bg-white">
                      <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                      <td className="py-1 align-top">{a.accountName}</td>
                      <td className="text-right px-4 py-1 align-top">{formatNumber((a.credit - a.debit))}</td>
                    </tr>
                  ))}
                  {/* Operating Profit */}
                  <tr className="bg-muted font-bold">
                    <td colSpan={2} className="border-t px-4 py-2">กำไรจากการดำเนินงาน (Operating Profit)</td>
                    <td className={"border-t text-right px-4 py-2"}>{formatNumber(sections.opProfit)}</td>
                  </tr>
                  {/* Other Income/Expenses */}
                  {sections.other.items.length > 0 && (
                    <>
                      <tr className="font-semibold text-primary bg-muted">
                        <td colSpan={2} className="border-t px-4 py-2">{sections.other.label}</td>
                        <td className="border-t text-right px-4 py-2">{formatNumber(sections.other.total)}</td>
                      </tr>
                      {sections.other.items.map((a) => (
                        <tr key={a.accountNumber} className="text-muted-foreground bg-white">
                          <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                          <td className="py-1 align-top">{a.accountName}</td>
                          <td className="text-right px-4 py-1 align-top">{formatNumber(a.credit - a.debit)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  {/* Tax */}
                  {sections.tax.items.length > 0 && (
                    <>
                      <tr className="font-semibold text-primary bg-muted">
                        <td colSpan={2} className="border-t px-4 py-2">{sections.tax.label}</td>
                        <td className="border-t text-right px-4 py-2">{formatNumber(sections.tax.total)}</td>
                      </tr>
                      {sections.tax.items.map((a) => (
                        <tr key={a.accountNumber} className="text-muted-foreground bg-white">
                          <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                          <td className="py-1 align-top">{a.accountName}</td>
                          <td className="text-right px-4 py-1 align-top">{formatNumber(Math.abs(a.credit - a.debit))}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  {/* Net Profit */}
                  <tr className="bg-primary text-primary-foreground font-bold text-lg">
                    <td colSpan={2} className="border-t border-b px-4 py-2">กำไรสุทธิ (Net Profit)</td>
                    <td className="border-t border-b text-right px-4 py-2">{formatNumber(sections.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </PrintWrapper>
      </div>
    </>
  );
};

export default ProfitLossReport;
