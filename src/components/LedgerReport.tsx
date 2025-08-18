import React from "react";
import AccountBreadcrumb from "./AccountBreadcrumb";

interface LedgerReportProps {
  onBack: () => void;
}

const LedgerReport: React.FC<LedgerReportProps> = ({ onBack }) => (
  <div className="w-full">
    <AccountBreadcrumb onBack={onBack} onRoot={onBack} current="สมุดบัญชีแยกประเภท" />
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full">
      <h2 className="text-xl font-bold mb-4">สมุดบัญชีแยกประเภท</h2>
      <div className="text-gray-700 dark:text-gray-200">(แสดงรายงานสมุดบัญชีแยกประเภทที่นี่)</div>
    </div>
  </div>
);

export default LedgerReport;
