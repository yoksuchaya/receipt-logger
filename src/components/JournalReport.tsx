

import React, { useEffect, useState } from "react";
import AccountBreadcrumb from "./AccountBreadcrumb";
import VatReportHeader from "./VatReportHeader";
import PrintWrapper from "./PrintWrapper";
import { formatMoney } from "./utils";


interface JournalReportProps {
  onBack: () => void;
}

type JournalEntry = {
  date: string;
  description: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
};


const monthNames = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
];
const monthOptions = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

function getCurrentMonthYear() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return { month, year };
}

const fetchJournalEntries = async (month: string, year: string) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const url = `/api/journal-report?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
};

const JournalReport: React.FC<JournalReportProps> = ({ onBack }) => {

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);


  // Month/year state
  const { month: initialMonth, year: initialYear } = getCurrentMonthYear();
  const [month, setMonth] = useState<string>(initialMonth);
  const [year, setYear] = useState<string>(initialYear);
  // Generate year options (current year +/- 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());



  useEffect(() => {
    setLoading(true);
    fetchJournalEntries(month, year).then((entries) => {
      setJournalEntries(entries);
      setLoading(false);
    });
  }, [month, year]);


  return (
    <div className="w-full">
      <AccountBreadcrumb onBack={onBack} onRoot={onBack} current="สมุดรายวันทั่วไป" />
      <PrintWrapper printLabel="สมุดรายวันทั่วไป" printButtonLabel="พิมพ์สมุดรายวันทั่วไป">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-full">
          <VatReportHeader
            month={month}
            year={year}
            monthOptions={monthOptions}
            yearOptions={yearOptions}
            onMonthChange={setMonth}
            onYearChange={setYear}
            title="สมุดรายวันทั่วไป"
          />
          <div className="overflow-x-auto vat-table">
            {loading ? (
              <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
            ) : (
              <table className="min-w-full text-sm border border-gray-200 dark:border-neutral-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-neutral-800">
                    <th className="px-2 py-1 border">วันที่</th>
                    <th className="px-2 py-1 border">รายละเอียด</th>
                    <th className="px-2 py-1 border">เลขที่บัญชี</th>
                    <th className="px-2 py-1 border">ชื่อบัญชี</th>
                    <th className="px-2 py-1 border text-right">เดบิต</th>
                    <th className="px-2 py-1 border text-right">เครดิต</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4">ไม่มีข้อมูลสมุดรายวัน</td></tr>
                  ) : (
                    journalEntries.map((entry, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-2 py-1 border whitespace-nowrap">{entry.date}</td>
                        <td className="px-2 py-1 border">{entry.description}</td>
                        <td className="px-2 py-1 border text-center">{entry.accountNumber}</td>
                        <td className="px-2 py-1 border">{entry.accountName}</td>
                        <td className="px-2 py-1 border text-right">{entry.debit === 0 ? '' : formatMoney(entry.debit)}</td>
                        <td className="px-2 py-1 border text-right">{entry.credit === 0 ? '' : formatMoney(entry.credit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Table footer for totals */}
                {journalEntries.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-neutral-800 font-bold">
                      <td className="px-2 py-1 border text-right" colSpan={4}>รวม</td>
                      <td className="px-2 py-1 border text-right">
                        {(() => { const sum = journalEntries.reduce((sum, e) => sum + (e.debit || 0), 0); return sum === 0 ? '' : formatMoney(sum); })()}
                      </td>
                      <td className="px-2 py-1 border text-right">
                        {(() => { const sum = journalEntries.reduce((sum, e) => sum + (e.credit || 0), 0); return sum === 0 ? '' : formatMoney(sum); })()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </PrintWrapper>
    </div>
  );
};

export default JournalReport;
