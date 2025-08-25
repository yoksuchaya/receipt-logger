import React from "react";
import { CompanyProfileData } from "./CompanyProfile";

interface Props {
  company: CompanyProfileData;
  editingBasic: boolean;
  editData: CompanyProfileData | null;
  setEditingBasic: (v: boolean) => void;
  setEditData: React.Dispatch<React.SetStateAction<CompanyProfileData | null>>;
  setCompany: (d: CompanyProfileData) => void;
}

const CompanyBasicInfo: React.FC<Props> = ({ company, editingBasic, editData, setEditingBasic, setEditData, setCompany }) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ชื่อบริษัท:</span>
          <span className="text-gray-900 dark:text-white text-sm break-words">{company.company_name}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">เลขประจำตัวผู้เสียภาษี:</span>
          <span className="text-gray-900 dark:text-white text-sm break-words">{company.tax_id}</span>
        </div>
        <div className="sm:col-span-2 flex flex-col">
          <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">ที่อยู่:</span>
          <span className="text-gray-900 dark:text-white text-sm break-words">{company.address}</span>
        </div>
        <div className="sm:col-span-2 flex flex-col">
          <span className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-0.5">โทรศัพท์:</span>
          <span className="text-gray-900 dark:text-white text-sm break-words">{company.phones && company.phones.length > 0 ? company.phones.join(', ') : '-'}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        {!editingBasic && (
          <button
            className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            onClick={() => {
              setEditingBasic(true);
              setEditData({ ...company });
            }}
            aria-label="แก้ไขข้อมูลบริษัท"
          >
            แก้ไข
          </button>
        )}
      </div>
      {editingBasic && (
        <div className="w-full bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 mt-4 shadow-sm">
          <form
            className="space-y-0"
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
                setEditingBasic(false);
              } catch (err: any) {
                alert(err.message || 'เกิดข้อผิดพลาด');
              }
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col mb-2">
                <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-1">ชื่อบริษัท:</label>
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                  value={editData?.company_name || ''}
                  onChange={e => setEditData(d => d ? { ...d, company_name: e.target.value } : d)}
                  required
                />
              </div>
              <div className="flex flex-col mb-2">
                <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-1">เลขประจำตัวผู้เสียภาษี:</label>
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                  value={editData?.tax_id || ''}
                  onChange={e => setEditData(d => d ? { ...d, tax_id: e.target.value } : d)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex flex-col mb-2">
                <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-1">ที่อยู่:</label>
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                  value={editData?.address || ''}
                  onChange={e => setEditData(d => d ? { ...d, address: e.target.value } : d)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex flex-col mb-2">
                <label className="font-medium text-gray-600 dark:text-gray-300 text-xs mb-1">โทรศัพท์ (คั่นด้วย ,):</label>
                <input
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                  value={editData?.phones?.join(', ') || ''}
                  onChange={e => setEditData(d => d ? { ...d, phones: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : d)}
                />
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
                onClick={() => setEditingBasic(false)}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyBasicInfo;
