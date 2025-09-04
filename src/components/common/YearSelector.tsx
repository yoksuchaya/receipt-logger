import React from "react";

interface YearSelectorProps {
  year: string;
  yearOptions?: string[];
  onYearChange: (year: string) => void;
  className?: string;
}

const defaultYearOptions: string[] = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());

const YearSelector: React.FC<YearSelectorProps> = ({
  year,
  yearOptions = defaultYearOptions,
  onYearChange,
  className = "",
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <label htmlFor="year-select" className="sr-only">ปี</label>
      <select
        id="year-select"
        className="border rounded px-2 py-1 focus:outline-none focus:ring"
        value={year}
        onChange={e => onYearChange(e.target.value)}
      >
        {yearOptions.map((y: string) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;
