import React from "react";

interface VatReportHeaderProps {
    month: string;
    year: string;
    monthOptions: { value: string; label: string }[];
    yearOptions: string[];
    onMonthChange: (m: string) => void;
    onYearChange: (y: string) => void;
    title: string;
}

const VatReportHeader: React.FC<VatReportHeaderProps> = ({
    month,
    year,
    monthOptions,
    yearOptions,
    onMonthChange,
    onYearChange,
    title
}) => (
    <div className="mb-4 text-center">
        <div className="font-bold text-lg">ห้างเพชรทองมุกดา จำกัด (สำนักงานใหญ่)</div>
        <div>เลขประจำตัวผู้เสียภาษี: 0735559006568</div>
        <div>ที่อยู่: เลขที่ 100/10 หมู่ 8 ตำบลอ้อมใหญ่ อำเภอสามพราน จังหวัดนครปฐม 73160</div>
        <div>โทรศัพท์ : 02-4206075, 02-8115693</div>
        <div className="font-semibold mt-2">{title}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-2 items-center no-print">
            <label htmlFor="month" className="font-normal">เดือน</label>
            <select
                id="month"
                className="border rounded px-2 py-1"
                value={month}
                onChange={e => onMonthChange(e.target.value)}
            >
                {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <label htmlFor="year" className="font-normal">ปี</label>
            <select
                id="year"
                className="border rounded px-2 py-1"
                value={year}
                onChange={e => onYearChange(e.target.value)}
            >
                {yearOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
        <div className="mt-1">ประจำเดือน: {monthOptions.find(m => m.value === month)?.label} / {year}</div>
    </div>
);

export default VatReportHeader;
