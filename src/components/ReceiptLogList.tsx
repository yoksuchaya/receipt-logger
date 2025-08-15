"use client";
import { formatMoney } from "./utils";
import React, { useEffect, useState } from "react";
import ReceiptBreadcrumb from "./ReceiptBreadcrumb";
import ReceiptDetail from "./ReceiptDetail";
import ReceiptEditForm from "./ReceiptEditForm";

interface ReceiptLog {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  [key: string]: any;
}

const ReceiptLogList: React.FC = () => {
  const [logs, setLogs] = useState<ReceiptLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReceiptLog | null>(null);
  const [edit, setEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetch("/api/receipt-log")
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load receipt logs");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-blue-600">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!logs.length) return <div className="text-gray-600">ยังไม่มีใบเสร็จที่อัปโหลด</div>;

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
          <h3 className="text-lg font-bold mb-4">{edit ? 'แก้ไขใบเสร็จ' : 'รายละเอียดใบเสร็จ'}</h3>
          {edit ? (
            <ReceiptEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              onSave={async () => {
                await fetch('/api/receipt-log/edit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
                setLogs(logs.map(l => l.uploadedAt === editForm.uploadedAt ? { ...l, ...editForm } : l));
                setSelected(null);
                setEdit(false);
              }}
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
      <div className="w-full max-w-full overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm border border-gray-300 dark:border-neutral-700">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">วันที่</th>
              <th className="px-3 py-2 text-left">หมายเลขใบเสร็จ</th>
              <th className="px-3 py-2 text-left">ยอดรวม</th>
              <th className="px-3 py-2 text-left">หมายเหตุ</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-t border-gray-200 dark:border-neutral-700">
                <td className="px-3 py-2">{log.date ? log.date : '-'}</td>
                <td className="px-3 py-2">{log.receipt_no ? log.receipt_no : '-'}</td>
                <td className="px-3 py-2">{formatMoney(log.grand_total)}</td>
                <td className="px-3 py-2">{log.notes ? log.notes : '-'}</td>
                <td className="px-3 py-2 flex flex-col sm:flex-row gap-2">
                  <button className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 w-full sm:w-auto" onClick={() => { setSelected(log); setEdit(false); }}>ดูข้อมูล</button>
                  <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 w-full sm:w-auto" onClick={() => { setSelected(log); setEdit(true); setEditForm(log); }}>แก้ไข</button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 w-full sm:w-auto" onClick={async () => {
                    if (window.confirm('Delete this receipt?')) {
                      await fetch('/api/receipt-log/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadedAt: log.uploadedAt }) });
                      setLogs(logs.filter(l => l.uploadedAt !== log.uploadedAt));
                    }
                  }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceiptLogList;
