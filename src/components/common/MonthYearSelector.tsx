
import React from "react";

interface MonthOption {
	value: string;
	label: string;
}

interface MonthYearSelectorProps {
	month: string;
	year: string;
	monthOptions?: MonthOption[];
	yearOptions?: string[];
	onMonthChange: (month: string) => void;
	onYearChange: (year: string) => void;
	className?: string;
}

const defaultMonthOptions: MonthOption[] = [
	{ value: "01", label: "มกราคม" },
	{ value: "02", label: "กุมภาพันธ์" },
	{ value: "03", label: "มีนาคม" },
	{ value: "04", label: "เมษายน" },
	{ value: "05", label: "พฤษภาคม" },
	{ value: "06", label: "มิถุนายน" },
	{ value: "07", label: "กรกฎาคม" },
	{ value: "08", label: "สิงหาคม" },
	{ value: "09", label: "กันยายน" },
	{ value: "10", label: "ตุลาคม" },
	{ value: "11", label: "พฤศจิกายน" },
	{ value: "12", label: "ธันวาคม" },
];

const defaultYearOptions: string[] = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());

const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
	month,
	year,
	monthOptions = defaultMonthOptions,
	yearOptions = defaultYearOptions,
	onMonthChange,
	onYearChange,
	className = "",
}) => {
	return (
		<div className={`flex flex-wrap gap-2 items-center ${className}`}>
			<label htmlFor="month-select" className="sr-only">เดือน</label>
			<select
				id="month-select"
				className="border rounded px-2 py-1 focus:outline-none focus:ring"
				value={month}
				onChange={e => onMonthChange(e.target.value)}
			>
				{monthOptions.map(opt => (
					<option key={opt.value} value={opt.value}>{opt.label}</option>
				))}
			</select>
			<label htmlFor="year-select" className="sr-only">ปี</label>
			<select
				id="year-select"
				className="border rounded px-2 py-1 focus:outline-none focus:ring"
				value={year}
				onChange={e => onYearChange(e.target.value)}
			>
				{yearOptions.map(y => (
					<option key={y} value={y}>{y}</option>
				))}
			</select>
		</div>
	);
};

export default MonthYearSelector;
