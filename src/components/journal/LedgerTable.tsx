import React from "react";
import { formatMoney } from "../utils/utils";
import ReportHeader from "../common/ReportHeader";

interface LedgerEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerAccount {
  accountNumber: string;
  accountName: string;
  openingBalance: number;
  entries: LedgerEntry[];
}

interface LedgerTableProps {
  acc: LedgerAccount;
  month: string;
  year: string;
}

const LedgerTable: React.FC<LedgerTableProps> = ({ acc, month, year }) => {
  return (
    <>
      {/* Print-only header using ReportHeader */}
      <div className="mb-2 print:mb-1 hidden print:block">
        <ReportHeader
          month={month}
          year={year}
          onMonthChange={() => { }}
          onYearChange={() => { }}
          title={`สมุดบัญชีแยกประเภท: ${acc.accountNumber} - ${acc.accountName}`}
        />
      </div>
      {/* Screen-only ledger title */}
      <div className="font-semibold text-lg mb-2 print:hidden">
        {acc.accountNumber} - {acc.accountName}
      </div>
      <table className="min-w-full border text-sm vat-table">
        <thead className="bg-gray-100 dark:bg-neutral-800">
          <tr>
            <th className="border border-gray-300 px-2 py-1">วันที่</th>
            <th className="border border-gray-300 px-2 py-1">เลขที่อ้างอิง</th>
            <th className="border border-gray-300 px-2 py-1">รายละเอียด</th>
            <th className="border border-gray-300 px-2 py-1 text-right">เดบิต</th>
            <th className="border border-gray-300 px-2 py-1 text-right">เครดิต</th>
            <th className="border border-gray-300 px-2 py-1 text-right">ยอดคงเหลือ</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-yellow-50 dark:bg-neutral-900 font-semibold">
            <td className="border border-gray-300 px-2 py-1" colSpan={5}>ยอดยกมา</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(acc.openingBalance === 0 ? '' : acc.openingBalance, "0.00")}</td>
          </tr>
          {acc.entries.map((entry, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
              <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{entry.date}</td>
              <td className="border border-gray-300 px-2 py-1">{entry.reference}</td>
              <td className="border border-gray-300 px-2 py-1">{entry.description}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(entry.debit === 0 ? '' : entry.debit)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(entry.credit === 0 ? '' : entry.credit)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{formatMoney(entry.runningBalance === 0 ? '' : entry.runningBalance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 dark:bg-neutral-800 font-semibold">
            <td className="border border-gray-300 px-2 py-1 text-right" colSpan={3}>รวม</td>
            <td className="border border-gray-300 px-2 py-1 text-right">
              {(() => { const sum = acc.entries.reduce((s, e) => s + (e.debit || 0), 0); return formatMoney(sum === 0 ? '' : sum); })()}
            </td>
            <td className="border border-gray-300 px-2 py-1 text-right">
              {(() => { const sum = acc.entries.reduce((s, e) => s + (e.credit || 0), 0); return formatMoney(sum === 0 ? '' : sum); })()}
            </td>
            <td className="border border-gray-300 px-2 py-1 text-right">
              {(() => {
                const last = acc.entries.length > 0 ? acc.entries[acc.entries.length - 1].runningBalance : acc.openingBalance;
                return formatMoney(last === 0 ? '' : last);
              })()}
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
};

export default LedgerTable;
