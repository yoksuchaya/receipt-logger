import React, { useState, useEffect } from "react";
import BalanceSheetReport from "./BalanceSheetReport";
import ProfitLossReport from '../report/ProfitLossReport';
import YearSelector from '../common/YearSelector';
import { TrialBalanceItem } from '../types/TrialBalanceItem';

const AccountingReport: React.FC = () => {
  const currentYear = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYear);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/trial-balance?period=${year}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setTrialBalance(json.trialBalance || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);
  return (
  <div className="w-full mx-auto py-8 mt-8 px-8">
    <div className="flex justify-center items-center mb-6">
      <YearSelector year={year} onYearChange={setYear} />
    </div>
      <section>
        <ProfitLossReport year={year} trialBalance={trialBalance} loading={loading} error={error} />
      </section>
      <section>
        <BalanceSheetReport year={year} trialBalance={trialBalance} loading={loading} error={error} />
      </section>
    </div>
  );
};

export default AccountingReport;
