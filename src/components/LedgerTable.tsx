import React from "react";
import { formatMoney } from "./utils";

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
  monthOptions: { value: string; label: string }[];
}

const LedgerTable: React.FC<LedgerTableProps> = ({ acc, month, year, monthOptions }) => (
  <>
    {/* Print-only header */}
    <div className="mb-2 print:mb-1 hidden print:block">
      <div className="font-bold text-base sm:text-lg">ห้างเพชรทองมุกดา จำกัด (สำนักงานใหญ่)</div>
      <div className="text-xs sm:text-sm">เลขประจำตัวผู้เสียภาษี: 0735559006568</div>
      <div className="text-xs sm:text-sm">ที่อยู่: เลขที่ 100/10 หมู่ 8 ตำบลอ้อมใหญ่ อำเภอสามพราน จังหวัดนครปฐม 73160</div>
      <div className="text-xs sm:text-sm mb-1">โทรศัพท์ : 02-4206075, 02-8115693</div>
      <div className="font-semibold mt-1">สมุดบัญชีแยกประเภท</div>
      <div className="text-xs sm:text-sm">บัญชี: {acc.accountNumber} - {acc.accountName}</div>
      <div className="text-xs sm:text-sm">ประจำเดือน: {monthOptions.find(m => m.value === month)?.label} / {year}</div>
    </div>
    {/* Screen-only ledger title */}
    <div className="font-semibold text-lg mb-2 print:hidden">
      {acc.accountNumber} - {acc.accountName}
    </div>
    <table className="min-w-full border text-sm vat-table">
      <thead className="bg-gray-100 dark:bg-neutral-800">
        <tr>
          <th className="border px-2 py-1">วันที่</th>
          <th className="border px-2 py-1">รายละเอียด</th>
          <th className="border px-2 py-1">เลขที่อ้างอิง</th>
          <th className="border px-2 py-1 text-right">เดบิต</th>
          <th className="border px-2 py-1 text-right">เครดิต</th>
          <th className="border px-2 py-1 text-right">ยอดคงเหลือ</th>
        </tr>
      </thead>
      <tbody>
        <tr className="bg-yellow-50 dark:bg-neutral-900 font-semibold">
          <td className="border px-2 py-1" colSpan={5}>ยอดยกมา</td>
          <td className="border px-2 py-1 text-right">{formatMoney(acc.openingBalance === 0 ? '' : acc.openingBalance, "0.00")}</td>
        </tr>
        {acc.entries.map((entry, i) => (
          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
            <td className="border px-2 py-1 whitespace-nowrap">{entry.date}</td>
            <td className="border px-2 py-1">{entry.description}</td>
            <td className="border px-2 py-1">{entry.reference}</td>
            <td className="border px-2 py-1 text-right">{formatMoney(entry.debit === 0 ? '' : entry.debit)}</td>
            <td className="border px-2 py-1 text-right">{formatMoney(entry.credit === 0 ? '' : entry.credit)}</td>
            <td className="border px-2 py-1 text-right">{formatMoney(entry.runningBalance === 0 ? '' : entry.runningBalance)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-gray-100 dark:bg-neutral-800 font-semibold">
          <td className="border px-2 py-1 text-right" colSpan={3}>รวม</td>
          <td className="border px-2 py-1 text-right">
            {(() => { const sum = acc.entries.reduce((s, e) => s + (e.debit || 0), 0); return formatMoney(sum === 0 ? '' : sum); })()}
          </td>
          <td className="border px-2 py-1 text-right">
            {(() => { const sum = acc.entries.reduce((s, e) => s + (e.credit || 0), 0); return formatMoney(sum === 0 ? '' : sum); })()}
          </td>
          <td className="border px-2 py-1 text-right">
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

export default LedgerTable;
