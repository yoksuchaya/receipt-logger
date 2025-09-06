"use client";
import { formatMoney } from "../utils/utils";
import React, { useEffect, useState } from "react";
import ReceiptBreadcrumb from "./ReceiptBreadcrumb";
import ReceiptDetail from "./ReceiptDetail";
import ReceiptEditForm from "./ReceiptEditForm";


interface ReceiptLog {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  receipt_no?: string;
  date?: string;
  category?: string;
  vendor?: string;
  vendor_tax_id?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_tax_id?: string;
  grand_total?: number | string;
  vat?: number | string;
  payment_type?: string;
  notes?: string;
  type?: 'sale' | 'purchase' | undefined;
}

const ReceiptLogList: React.FC = () => {
  const [logs, setLogs] = useState<ReceiptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReceiptLog | null>(null);
  const [edit, setEdit] = useState(false);
  const [editForm, setEditForm] = useState<import("./ReceiptEditForm").ReceiptEditFormData>({});
  // Set initial date range: first day of current month to today (or last day of month if today is not in current month)
  function formatLocalDate(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function getInitialDateRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const todayStr = formatLocalDate(now);
    const firstStr = formatLocalDate(first);
    const lastStr = formatLocalDate(last);
    return { from: firstStr, to: todayStr <= lastStr ? todayStr : lastStr };
  }
  const initialRange = getInitialDateRange();
  const [fromDate, setFromDate] = useState<string>(initialRange.from);
  const [toDate, setToDate] = useState<string>(initialRange.to);
  // Use string for typeFilter to allow dynamic types
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // journalTypeLabels from account-chart
  const [journalTypeLabels, setJournalTypeLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/api/account-chart')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.journalTypeLabels === 'object') {
          setJournalTypeLabels(data.journalTypeLabels);
        }
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    fetch(`/api/receipt-log${params.toString() ? '?' + params.toString() : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
          setError("Failed to load receipt logs");
          setLoading(false);
        });
  }, [fromDate, toDate, typeFilter]);


  // Only filter logs by from/to date (type is filtered by API)
  const filteredLogs = logs.filter(log => {
    if (!log.date) return true;
    const logDate = new Date(log.date);
    if (fromDate && logDate < new Date(fromDate)) return false;
    if (toDate && logDate > new Date(toDate)) return false;
    return true;
  });

  if (loading) return <div className="text-blue-600">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  // Breadcrumb navigation: list > view > edit
  if (selected) {
    return (
      <div className="w-full px-2 sm:px-0">
        <ReceiptBreadcrumb
          edit={edit}
          onBack={() => { setSelected(null); setEdit(false); }}
          onEdit={() => setEdit(false)}
        />
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full">
          <h3 className="text-lg font-bold mb-4">{edit ? 'แก้ไขเอกสาร' : 'รายละเอียดเอกสาร'}</h3>
          {edit ? (
            <ReceiptEditForm
              systemGenerated={!!editForm?.systemGenerated}
              initialValues={editForm}
              onSubmit={async (form) => {
                await fetch('/api/receipt-log/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
                if ('receipt_no' in form && typeof form.receipt_no === 'string') {
                  setLogs(logs.map(l => l.receipt_no === form.receipt_no ? { ...l, ...(form as ReceiptLog) } : l));
                }
                setSelected(null);
                setEdit(false);
              }}
              onCancel={() => { setSelected(null); setEdit(false); }}
            />
          ) : (
            <ReceiptDetail
              selected={selected}
              onEdit={() => { setEdit(true); setEditForm(selected); }}
              onDelete={async () => {
                if (window.confirm('Delete this receipt?')) {
                  await fetch('/api/receipt-log/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadedAt: selected.uploadedAt }) });
                  setLogs(logs.filter(l => l.uploadedAt !== selected.uploadedAt));
                  setSelected(null);
                  setEdit(false);
                }
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Default: show table
  return (
    <div className="w-full max-w-full">
  <div className="flex flex-wrap gap-3 mb-4 items-end bg-white dark:bg-neutral-900 rounded-lg p-3">
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="fromDate" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">จากวันที่</label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100 transition"
          />
        </div>
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="toDate" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">ถึงวันที่</label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100 transition"
          />
        </div>
        <div className="flex flex-col min-w-[160px]">
          <label htmlFor="typeFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">ประเภทเอกสาร</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-neutral-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:text-gray-100 transition"
          >
            <option value="all">ทั้งหมด</option>
            {Object.entries(journalTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {(fromDate || toDate || typeFilter !== 'all') && (
          <button onClick={() => { setFromDate(""); setToDate(""); setTypeFilter('all'); }} className="ml-2 px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs">ล้างตัวกรอง</button>
        )}
      </div>
      {filteredLogs.length === 0 ? (
        <div className="text-gray-600">ไม่มีเอกสาร</div>
      ) : (
        <div className="w-full max-w-full overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm border border-gray-300">
            <thead className="bg-gray-100 dark:bg-neutral-800">
              <tr>
                <th className="px-3 py-2 text-left">วันที่</th>
                <th className="px-3 py-2 text-left">ประเภท</th>
                <th className="px-3 py-2 text-left">หมายเลขเอกสาร</th>
                <th className="px-3 py-2 text-left">ยอดรวม</th>
                <th className="px-3 py-2 text-left">หมายเหตุ</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => {
                let typeLabel = '-';
                if (log.type && journalTypeLabels[log.type]) {
                  typeLabel = journalTypeLabels[log.type];
                }
                return (
                  <tr key={i} className="border-t border-gray-200 dark:border-neutral-700">
                    <td className="px-3 py-2">{log.date ? log.date : '-'}</td>
                    <td className="px-3 py-2">{typeLabel}</td>
                    <td className="px-3 py-2">{log.receipt_no ? log.receipt_no : '-'}</td>
                    <td className="px-3 py-2">{formatMoney(log.grand_total)}</td>
                    <td className="px-3 py-2">{log.notes ? log.notes : '-'}</td>
                    <td className="px-3 py-2 flex flex-col sm:flex-row gap-2">
                      <button className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 w-full sm:w-auto" onClick={() => { setSelected(log); setEdit(false); }}>ดูข้อมูล</button>
                      <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 w-full sm:w-auto" onClick={() => { setSelected(log); setEdit(true); setEditForm(log); }}>แก้ไข</button>
                      <button className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 w-full sm:w-auto" onClick={async () => {
                        if (window.confirm('Delete this receipt?')) {
                          await fetch('/api/receipt-log/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receipt_no: log.receipt_no }) });
                          setLogs(logs.filter(l => l.receipt_no !== log.receipt_no));
                        }
                      }}>ลบ</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReceiptLogList;
