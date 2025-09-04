import React, { useState } from "react";
import BalanceSheetReport from "./BalanceSheetReport";
import ProfitLossReport from '../report/ProfitLossReport';
import YearSelector from '../common/YearSelector';
// import BalanceSheetReport from '../report/BalanceSheetReport'; // Uncomment when BalanceSheetReport exists

const AccountingReport: React.FC = () => {
  const currentYear = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYear);
  return (
  <div className="w-full max-w-5xl mx-auto py-8 mt-8 px-8">
    <div className="flex justify-center items-center mb-6">
      <YearSelector year={year} onYearChange={setYear} />
    </div>
      <section>
        <ProfitLossReport year={year} />
      </section>
      <section>
        <BalanceSheetReport year={year} />
      </section>
    </div>
  );
};

export default AccountingReport;
