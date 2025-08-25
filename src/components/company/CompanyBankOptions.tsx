

import React from "react";
import { CompanyProfileData, PaymentBankOption } from "./CompanyProfile";

interface Props {
  company: CompanyProfileData;
  editingBank: boolean;
  editData: CompanyProfileData | null;
  setEditingBank: (v: boolean) => void;
  setEditData: React.Dispatch<React.SetStateAction<CompanyProfileData | null>>;
  setCompany: (d: CompanyProfileData) => void;
  receipts: any[];
  newBankLabel: string;
  setNewBankLabel: (v: string) => void;
  newBankShort: string;
  setNewBankShort: (v: string) => void;
}


function isBankUsed(bankValue: string, receipts: any[]): boolean {
  return receipts.some((r: any) => r.bank === bankValue);
}

const CompanyBankOptions: React.FC<Props> = ({ company, editingBank, editData, setEditingBank, setEditData, setCompany, receipts, newBankLabel, setNewBankLabel, newBankShort, setNewBankShort }) => {
  if (!company.paymentBankOptions || company.paymentBankOptions.length === 0) return null;
  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 mt-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">ช่องทางรับชำระ/ธนาคาร</span>
        {!editingBank && (
          <button
            className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            onClick={() => {
              setEditingBank(true);
              setEditData({ ...company });
            }}
            aria-label="แก้ไขช่องทางรับชำระ"
          >
            แก้ไข
          </button>
        )}
      </div>
      {!editingBank ? (
        <div className="overflow-x-auto">
          <table className="min-w-[320px] w-full border border-gray-200 dark:border-neutral-700 rounded text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800">
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ช่องทาง/ธนาคาร</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">รหัส (Short)</th>
              </tr>
            </thead>
            <tbody>
              {company.paymentBankOptions.map((bank: PaymentBankOption) => (
                <tr key={bank.value} className="border-t border-gray-100 dark:border-neutral-800">
                  <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap font-medium">{bank.label}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{bank.shorts || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            if (!editData) return;
            try {
              const res = await fetch('/api/company-profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
              });
              if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
              setCompany(editData);
              setEditingBank(false);
            } catch (err: any) {
              alert(err.message || 'เกิดข้อผิดพลาด');
            }
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[320px] w-full border border-gray-200 dark:border-neutral-700 rounded text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800">
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ช่องทาง/ธนาคาร</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">รหัส (Short)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {editData?.paymentBankOptions?.map((bank: PaymentBankOption, idx: number) => {
                  const used = isBankUsed(bank.value, receipts);
                  return (
                    <tr key={bank.value} className="border-t border-gray-100 dark:border-neutral-800">
                      <td className="px-3 py-2">
                        <input
                          className="rounded border border-gray-300 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition disabled:bg-gray-100 disabled:dark:bg-neutral-800 disabled:text-gray-400"
                          value={bank.label}
                          onChange={e => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              const newBanks = [...((d.paymentBankOptions ?? []))];
                              newBanks[idx] = { ...newBanks[idx], label: e.target.value };
                              return { ...d, paymentBankOptions: newBanks };
                            });
                          }}
                          placeholder="ชื่อธนาคาร/ช่องทาง"
                          aria-label="ชื่อธนาคาร/ช่องทาง"
                          disabled={used}
                          title={used ? 'ธนาคารนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้' : ''}
                        />
                        {used && (
                          <div className="text-xs text-red-500 mt-1">ธนาคารนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="rounded border border-gray-300 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition disabled:bg-gray-100 disabled:dark:bg-neutral-800 disabled:text-gray-400"
                          value={bank.shorts || ''}
                          onChange={e => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              const newBanks = [...(d.paymentBankOptions || [])];
                              newBanks[idx] = { ...newBanks[idx], shorts: e.target.value };
                              return { ...d, paymentBankOptions: newBanks };
                            });
                          }}
                          placeholder="รหัส"
                          aria-label="รหัสธนาคาร/ช่องทาง"
                          disabled={used}
                          title={used ? 'ธนาคารนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้' : ''}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className={`text-xs ${used ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:underline'}`}
                          onClick={() => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              const newBanks = (d.paymentBankOptions || []).filter((_: any, i: number) => i !== idx);
                              return { ...d, paymentBankOptions: newBanks };
                            });
                          }}
                          aria-label={`ลบธนาคาร ${bank.label}`}
                          disabled={used}
                          title={used ? 'ธนาคารนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถลบได้' : ''}
                        >ลบ</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Add new bank option */}
          <div className="flex flex-col gap-1 mt-2 border-t pt-3">
            <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">เพิ่มช่องทาง/ธนาคารใหม่</label>
            <div className="flex gap-2 items-end">
              <input
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="ชื่อธนาคาร/ช่องทาง"
                aria-label="ชื่อธนาคาร/ช่องทางใหม่"
                value={newBankLabel}
                onChange={e => setNewBankLabel(e.target.value)}
              />
              <input
                className="rounded border border-gray-300 px-2 py-1 text-sm w-20 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="รหัส"
                aria-label="รหัสธนาคาร/ช่องทางใหม่"
                value={newBankShort}
                onChange={e => setNewBankShort(e.target.value)}
              />
              <button
                type="button"
                className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                onClick={() => {
                  if (!editData) return;
                  const label = newBankLabel.trim();
                  const shorts = newBankShort.trim();
                  if (!label) return;
                  setEditData((d: CompanyProfileData | null) => {
                    if (!d) return d;
                    return {
                      ...d,
                      paymentBankOptions: [
                        ...((d.paymentBankOptions ?? [])),
                        { value: label.toLowerCase().replace(/\s+/g, '_'), label, shorts },
                      ],
                    };
                  });
                  setNewBankLabel('');
                  setNewBankShort('');
                }}
              >เพิ่มธนาคาร</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              type="submit"
              className="px-2 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              บันทึก
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              onClick={() => setEditingBank(false)}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanyBankOptions;
