import AccountRuleInfo from "./AccountRuleInfo";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
  const [rules, setRules] = useState<any>(null);
  const [journalTypeLabels, setJournalTypeLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<{ type: string; idx: number } | null>(null);
  const [editValues, setEditValues] = useState<{ accountNumber: string; accountName: string; note?: string }>({ accountNumber: '', accountName: '', note: '' });
  const [paymentTypeLabels, setPaymentTypeLabels] = useState<Record<string, string>>({});
  // Section popover state for info icon
  const [sectionInfo, setSectionInfo] = useState<{ type: string | null }>({ type: null });

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
        if (json && typeof json.journalTypeLabels === 'object' && json.journalTypeLabels !== null) {
          setJournalTypeLabels(json.journalTypeLabels);
        } else {
          setJournalTypeLabels({});
        }
        setRules(json && json.rules ? json.rules : null);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/company-profile')
      .then(res => res.json())
      .then(profile => {
        if (Array.isArray(profile.paymentTypes)) {
          const map: Record<string, string> = {};
          profile.paymentTypes.forEach((pt: any) => {
            if (pt.value && pt.label) map[pt.value] = pt.label;
          });
          setPaymentTypeLabels(map);
        }
      });
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!data.length) return <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลผังบัญชี</div>;

  // Helper: get payment type mapping for an account
  const getPaymentTypeMapping = (accountNumber: string) => {
    if (!rules?.paymentTypeMap) return null;
    const mapping = Object.entries(rules.paymentTypeMap).filter(([_type, accNum]) => String(accNum) === accountNumber);
    if (mapping.length === 0) return null;
    return (
      <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-neutral-800 px-2 py-0.5 rounded">
        {mapping.map(([type]) => paymentTypeLabels[type] || type).join(', ')}
      </span>
    );
  };

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

  // Start editing
  const handleEdit = (type: string, idx: number, item: AccountChartItem) => {
    setEditIdx({ type, idx });
    setEditValues({ accountNumber: item.accountNumber, accountName: item.accountName, note: item.note || '' });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditIdx(null);
    setEditValues({ accountNumber: '', accountName: '', note: '' });
  };

  // Save editing (UI only, update rules and paymentTypeMap if account number changes)
  const handleSave = (type: string, idx: number) => {
    const oldAccountNumber = grouped[type][idx].accountNumber;
    const newAccountNumber = editValues.accountNumber;
    // Update local data
    const newData = data.map((item, i) => {
      if (grouped[type][idx] && item.accountNumber === oldAccountNumber) {
        return { ...item, ...editValues };
      }
      return item;
    });

    // Update rules and paymentTypeMap if account number changed
    let newRules = rules;
    if (oldAccountNumber !== newAccountNumber && rules) {
      // Update paymentTypeMap
      newRules = { ...rules, paymentTypeMap: { ...rules.paymentTypeMap } };
      Object.entries(rules.paymentTypeMap).forEach(([payType, accNum]) => {
        if (String(accNum) === oldAccountNumber) {
          newRules.paymentTypeMap[payType] = newAccountNumber;
        }
      });
      // Update all rules (purchase, sale, capital)
      const updateRuleAccount = (rule: any) => {
        ['debit', 'credit'].forEach((field) => {
          if (rule[field]) {
            // Handle multi-account (e.g. 1000|1010|1020)
            const parts = rule[field].split('|');
            const updated = parts.map((num: string) => num === oldAccountNumber ? newAccountNumber : num).join('|');
            rule[field] = updated;
          }
        });
      };
      ['purchase', 'sale', 'capital'].forEach((section) => {
        if (Array.isArray(rules[section])) {
          newRules[section] = rules[section].map((rule: any) => {
            const newRule = { ...rule };
            updateRuleAccount(newRule);
            return newRule;
          });
        }
      });
    }
    setData(newData);
    setRules(newRules);
    setEditIdx(null);
    setEditValues({ accountNumber: '', accountName: '', note: '' });
    // Persist changes to backend
    fetch('/api/account-chart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: newData, rules: newRules })
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save');
    }).catch(err => {
      // eslint-disable-next-line no-console
      console.error('Failed to persist account chart changes:', err);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">ผังบัญชี</h1>
        <div className="text-gray-600 dark:text-gray-300 mb-4 text-sm">รายการบัญชีที่ใช้ในระบบ</div>
        {sortedTypes.map((type) => (
          <div key={type} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 m-0">
                <span className="inline-block w-1.5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" aria-hidden="true"></span>
                {typeLabels[type] || type}
              </h2>
              <button
                type="button"
                className="ml-1 cursor-pointer text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white relative focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-full"
                aria-label="ดูรายละเอียดการใช้งานบัญชีในหมวดนี้"
                onClick={() => setSectionInfo({ type })}
                tabIndex={0}
              >
                <InformationCircleIcon className="w-5 h-5" aria-hidden="true" />
              </button>
              {/* Modal Dialog for Account Info */}
              {sectionInfo.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSectionInfo({ type: null })} />
                  <div
                    className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-8 overflow-y-auto max-h-[90vh] animate-fadeIn"
                    role="dialog"
                    aria-modal="true"
                    tabIndex={-1}
                  >
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl focus:outline-none"
                      aria-label="ปิด"
                      onClick={() => setSectionInfo({ type: null })}
                    >
                      &times;
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">รายละเอียดการใช้งานบัญชีในหมวด: {typeLabels[sectionInfo.type] || sectionInfo.type}</h3>
                    {grouped[sectionInfo.type]?.map((item) => (
                      <div key={item.accountNumber} className="mb-6 last:mb-0">
                        <div className="font-medium text-base text-gray-800 dark:text-gray-100 mb-2">{item.accountNumber} {item.accountName}</div>
                        <AccountRuleInfo accountNumber={item.accountNumber} rules={rules} journalTypeLabels={journalTypeLabels || {}} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <table className="min-w-full text-sm mb-2 table-fixed">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200 w-32">รหัสบัญชี</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200 w-64">ชื่อบัญชี</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200">หมายเหตุ</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-200 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[type].map((item, idx) => (
                  <tr key={item.accountNumber} className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800">
                    {editIdx && editIdx.type === type && editIdx.idx === idx ? (
                      <>
                        <td className="py-2 px-2 align-top">
                          <input
                            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            value={editValues.accountNumber}
                            onChange={e => setEditValues(v => ({ ...v, accountNumber: e.target.value }))}
                            placeholder="รหัสบัญชี"
                            aria-label="รหัสบัญชี"
                          />
                          {getPaymentTypeMapping(editValues.accountNumber)}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <input
                            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            value={editValues.accountName}
                            onChange={e => setEditValues(v => ({ ...v, accountName: e.target.value }))}
                            placeholder="ชื่อบัญชี"
                            aria-label="ชื่อบัญชี"
                          />
                        </td>
                        <td className="py-2 px-2 align-top">
                          <input
                            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            value={editValues.note}
                            onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))}
                            placeholder="หมายเหตุ"
                            aria-label="หมายเหตุ"
                          />
                        </td>
                        <td className="py-2 px-2 min-w-[120px] flex flex-col gap-1 sm:flex-row sm:items-center align-middle justify-center h-full">
                          <button
                            className="px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium text-sm shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            onClick={() => handleSave(type, idx)}
                            type="button"
                          >
                            บันทึก
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-sm shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                            onClick={handleCancel}
                            type="button"
                          >
                            ยกเลิก
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 text-gray-900 dark:text-white">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="leading-tight">{item.accountNumber}</span>
                            {getPaymentTypeMapping(item.accountNumber) && (
                              <span className="mt-0.5">{getPaymentTypeMapping(item.accountNumber)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-gray-900 dark:text-white">{item.accountName}</td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{item.note || '-'}</td>
                        <td className="py-2 px-2">
                          <button
                            className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                            onClick={() => handleEdit(type, idx, item)}
                            type="button"
                          >
                            แก้ไข
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountChart;
