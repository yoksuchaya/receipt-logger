import React from "react";

const files = [
  { name: "stock-report.csv", label: "Stock Movement (CSV)" },
  { name: "journal-entries.csv", label: "Journal Entries (CSV)" },
  { name: "summary.csv", label: "Summary (CSV)" },
];

export default function ExportReports() {
  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-6 flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ส่งออกรายงาน</h3>
      <p className="mb-4 text-gray-700 dark:text-gray-200 text-center">ดาวน์โหลดไฟล์รายงานที่สร้างจากข้อมูลใบเสร็จ</p>
      <ul className="w-full flex flex-col gap-3">
        {files.map((f) => (
          <li key={f.name}>
            <a
              href={`/${f.name}`}
              download={f.name}
              className="block w-full px-4 py-2 rounded bg-blue-600 text-white text-center font-medium hover:bg-blue-700 transition"
            >
              {f.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-gray-400">* หากไม่มีไฟล์ กรุณาสร้างรายงานก่อน</div>
    </div>
  );
}
