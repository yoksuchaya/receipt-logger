
import React from "react";
import LedgerTable from "./LedgerTable";

// This component expects ledgers in the LedgerAccount format (see LedgerTable.tsx)
// and passes the correct props to LedgerTable.
import type { LedgerAccount } from "./LedgerTable";

interface LedgerReportProps {
  ledgers: LedgerAccount[];
  month: string;
  year: string;
  monthOptions: { value: string; label: string }[];
}

const LedgerReport: React.FC<LedgerReportProps> = ({ ledgers, month, year, monthOptions }) => {
  return (
    <>
      {(ledgers ?? []).map((acc, idx) => (
        <div
          key={acc.accountNumber}
          className="print-ledger-break mb-8 print:mb-12"
          style={{ pageBreakAfter: idx !== ledgers.length - 1 ? 'always' : 'auto', breakAfter: idx !== ledgers.length - 1 ? 'page' : 'auto', WebkitBreakAfter: idx !== ledgers.length - 1 ? 'page' : 'auto', MozBreakAfter: idx !== ledgers.length - 1 ? 'page' : 'auto' }}
        >
          <LedgerTable acc={acc} month={month} year={year} monthOptions={monthOptions} />
        </div>
      ))}
    </>
  );
};

export default LedgerReport;
