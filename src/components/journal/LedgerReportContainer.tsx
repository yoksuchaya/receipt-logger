import React, { useEffect, useState } from "react";
import LedgerReport from "./LedgerReport";
import PrintWrapper from "../layout/PrintWrapper";
import MonthYearSelector from "../common/MonthYearSelector";

// Month/year options are now handled by VatReportHeader or child components

function getCurrentMonthYear() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return { month, year };
}

interface LedgerAccount {
  accountNumber: string;
  accountName: string;
  openingBalance: number;
  entries: any[];
}

interface Account {
  accountNumber: string;
  accountName: string;
}

interface LedgerApiResponse {
  month: string;
  ledger: LedgerAccount[];
}

interface LedgerReportContainerProps {
  onBack: () => void;
}

const LedgerReportContainer: React.FC<LedgerReportContainerProps> = ({ onBack }) => {
  const { month: initialMonth, year: initialYear } = getCurrentMonthYear();
  const [month, setMonth] = useState<string>(initialMonth);
  const [year, setYear] = useState<string>(initialYear);
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledgers, setLedgers] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch account list for filter
  useEffect(() => {
    fetch("/api/account-chart")
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch(() => setAccounts([]));
  }, []);

  // Fetch ledger data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append("month", `${year}-${month}`);
    if (accountNumber) params.append("accountNumber", accountNumber);
    fetch(`/api/ledger-report?${params.toString()}`)
      .then((res) => res.json())
      .then((data: LedgerApiResponse) => {
        setLedgers(data.ledger || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoading(false);
      });
  }, [month, year, accountNumber]);

  // Generate year options is now handled by VatReportHeader or child components

  return (
    <div className="w-full">
      <PrintWrapper printLabel="สมุดบัญชีแยกประเภท" printButtonLabel="พิมพ์สมุดบัญชีแยกประเภท">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-full">
          <h2 className="text-xl font-bold mb-4">สมุดบัญชีแยกประเภท</h2>
          <form className="mb-4 no-print">
            <div className="flex flex-col gap-2 items-center justify-center mt-2">
              <div className="w-full flex flex-col items-center justify-center">
                <label className="block text-sm font-medium mb-1">ประจำเดือน</label>
                <MonthYearSelector
                  month={month}
                  year={year}
                  onMonthChange={setMonth}
                  onYearChange={setYear}
                />
              </div>
              <div className="w-full flex justify-center">
                <div>
                  <label className="block text-sm font-medium mb-1">บัญชี</label>
                  <select
                    className="border rounded px-2 py-1 dark:bg-neutral-800"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    {accounts.map((acc) => (
                      <option key={acc.accountNumber} value={acc.accountNumber}>
                        {acc.accountNumber} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
          {loading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : ledgers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลสำหรับเดือนที่เลือก</div>
          ) : (
            <LedgerReport ledgers={ledgers} month={month} year={year} />
          )}
        </div>
      </PrintWrapper>
    </div>
  );
};

export default LedgerReportContainer;
