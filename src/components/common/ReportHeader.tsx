import React from "react";
import MonthYearSelector from "../common/MonthYearSelector";
import { monthOptions as sharedMonthOptions, getMonthLabel } from "../utils/monthLabels";


interface ReportHeaderProps {
    month: string;
    year: string;
    monthOptions?: { value: string; label: string }[];
    yearOptions?: string[];
    onMonthChange: (m: string) => void;
    onYearChange: (y: string) => void;
    title: string;
}

const defaultYearOptions = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());


const ReportHeader: React.FC<ReportHeaderProps> = ({
    month,
    year,
    monthOptions = sharedMonthOptions,
    yearOptions = defaultYearOptions,
    onMonthChange,
    onYearChange,
    title
}) => {
    const [companyProfile, setCompanyProfile] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        setLoading(true);
        fetch('/api/company-profile')
            .then(res => res.json())
            .then(data => {
                setCompanyProfile(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const companyAddress = companyProfile?.address;
    const addressParts = [
        companyAddress?.house_number ? `เลขที่ ${companyAddress.house_number}` : '',
        companyAddress?.moo ? `หมู่ ${companyAddress.moo}` : '',
        companyAddress?.soi ? `ซอย ${companyAddress.soi}` : '',
        companyAddress?.road ? `ถนน ${companyAddress.road}` : '',
        companyAddress?.district ? `ตำบล${companyAddress.district}` : '',
        companyAddress?.state ? `อำเภอ${companyAddress.state}` : '',
        companyAddress?.province ? `จังหวัด${companyAddress.province}` : '',
        companyAddress?.postal_code ? `รหัสไปรษณีย์ ${companyAddress.postal_code}` : ''
    ].filter(Boolean).join(' ');
    const address = addressParts;
    return (
        
        <div className="mb-4 text-center">
            {loading || !companyProfile ? (
                <div className="text-gray-400">Loading company info...</div>
            ) : (
                <>
                    <div className="font-bold text-lg">{companyProfile.company_name}</div>
                    <div>เลขประจำตัวผู้เสียภาษี: {companyProfile.tax_id}</div>
                    <div>ที่อยู่: {address}</div>
                    <div>โทรศัพท์ : {Array.isArray(companyProfile.phones) ? companyProfile.phones.join(', ') : companyProfile.phones}</div>
                </>
            )}
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
};

export default ReportHeader;
