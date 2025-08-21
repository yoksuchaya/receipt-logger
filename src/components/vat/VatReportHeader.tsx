import React from "react";
import MonthYearSelector from "../common/MonthYearSelector";
import { monthOptions as sharedMonthOptions, getMonthLabel } from "../utils/monthLabels";

interface VatReportHeaderProps {
    month: string;
    year: string;
    monthOptions?: { value: string; label: string }[];
    yearOptions?: string[];
    onMonthChange: (m: string) => void;
    onYearChange: (y: string) => void;
    title: string;
}



const defaultYearOptions = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());

const VatReportHeader: React.FC<VatReportHeaderProps> = ({
        month,
        year,
    monthOptions = sharedMonthOptions,
        yearOptions = defaultYearOptions,
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
                    <MonthYearSelector
                        month={month}
                        year={year}
                        monthOptions={monthOptions}
                        yearOptions={yearOptions}
                        onMonthChange={onMonthChange}
                        onYearChange={onYearChange}
                    />
                </div>
                <div className="mt-1">ประจำเดือน: {getMonthLabel(month)} / {year}</div>
        </div>
);

export default VatReportHeader;
