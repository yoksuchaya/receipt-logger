import React from "react";

import { useState } from "react";
import JournalReport from "./JournalReport";
import LedgerReportContainer from "./LedgerReportContainer";

const AccountBook: React.FC = () => {
  const [showJournal, setShowJournal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  if (showJournal) {
    return <JournalReport onBack={() => setShowJournal(false)} />;
  }

  if (showLedger) {
    return <LedgerReportContainer onBack={() => setShowLedger(false)} />;
  }

  return (
    <div className="w-full">
      <ul className="space-y-4 mb-4">
        <li>
          <button
            className="block w-full text-left p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-lg border border-blue-200 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
            onClick={() => setShowJournal(true)}
          >
            สมุดรายวันทั่วไป
          </button>
        </li>
        <li>
          <button
            className="block w-full text-left p-4 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-lg border border-green-200 dark:bg-neutral-800 dark:text-green-300 dark:hover:bg-neutral-700 dark:border-neutral-700 transition"
            onClick={() => setShowLedger(true)}
          >
            สมุดบัญชีแยกประเภท
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AccountBook;
