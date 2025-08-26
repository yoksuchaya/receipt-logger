import React, { useEffect, useState } from "react";

interface AccountChartItem {
  accountNumber: string;
  accountName: string;
  note?: string;
  type?: string;
}

const AccountChart: React.FC = () => {
  const [data, setData] = useState<AccountChartItem[]>([]);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/account-chart")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => {
        if (json && Array.isArray(json.accounts)) {
          setData(json.accounts);
        } else {
          setData([]);
        }
        if (json && typeof json.typeLabels === 'object' && json.typeLabels !== null) {
          setTypeLabels(json.typeLabels);
        } else {
          setTypeLabels({});
        }
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!data.length) return <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลผังบัญชี</div>;

  // Group accounts by type
  const grouped = data.reduce<Record<string, AccountChartItem[]>>((acc, item) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  // Sort types by typeLabels order if possible
  const typeOrder = Object.keys(typeLabels);
  const sortedTypes = Object.keys(grouped).sort((a, b) => {
    const aIdx = typeOrder.indexOf(a);
    const bIdx = typeOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
      {sortedTypes.map((type) => (
        <div key={type} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="inline-block w-1.5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" aria-hidden="true"></span>
            {typeLabels[type] || type}
          </h2>
          <table className="min-w-full text-sm mb-2 table-fixed">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-700">
                <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200 w-32">รหัสบัญชี</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200 w-64">ชื่อบัญชี</th>
              </tr>
            </thead>
            <tbody>
              {grouped[type].map((item) => (
                <tr key={item.accountNumber} className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800">
                  <td className="py-2 px-2 text-gray-900 dark:text-white">{item.accountNumber}</td>
                  <td className="py-2 px-2 text-gray-900 dark:text-white">{item.accountName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default AccountChart;
