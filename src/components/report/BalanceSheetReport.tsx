import React, { useEffect, useState } from "react";
import { TrialBalanceItem } from "../types/TrialBalanceItem";
import { formatMoney } from "../utils/utils";
import PrintWrapper from "../layout/PrintWrapper";
import ReportHeader from "../common/ReportHeader";

interface BalanceSheetReportProps {
    year: string;
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ year }) => {
    const [data, setData] = useState<TrialBalanceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/trial-balance?period=${year}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                setData(json.trialBalance || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [year]);

    // Group accounts by asset, liability, equity (example logic)
    const assets = data.filter(a => a.accountNumber.startsWith("1"));
    const liabilities = data.filter(a => a.accountNumber.startsWith("2"));
    const equity = data.filter(a => a.accountNumber.startsWith("3"));

    const sum = (arr: TrialBalanceItem[]) => arr.reduce((acc, a) => acc + (a.debit - a.credit), 0);

    // Calculate retained earnings (กำไรขาดทุนสะสม)
    const totalAssets = sum(assets);
    const totalLiabilities = sum(liabilities);
    const totalEquity = sum(equity);
    const retainedEarnings = totalAssets + (totalLiabilities + totalEquity);

    return (
        <div className="w-full max-w-5xl mx-auto py-8 mt-8 px-8 bg-white rounded-lg shadow-lg border border-gray-100">
            <PrintWrapper printLabel="งบแสดงฐานะการเงิน (Balance Sheet)">
                <h2 className="text-xl font-bold mb-4 print:hidden">งบแสดงฐานะการเงิน (Balance Sheet)</h2>
                {/* Print-only header */}
                <div className="hidden print:block">
                    <ReportHeader
                        month={"01"}
                        year={year}
                        onMonthChange={() => { }}
                        onYearChange={() => { }}
                        title="งบแสดงฐานะการเงิน (Balance Sheet)"
                    />
                </div>
                {loading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading...</div>
                ) : error ? (
                    <div className="text-center py-16 text-destructive">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-separate border-spacing-y-1">
                            <thead>
                                <tr className="bg-muted font-semibold">
                                    <th className="px-4 py-2 text-left">Account</th>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Assets */}
                                <tr className="font-bold bg-muted">
                                    <td colSpan={3} className="px-4 py-2">สินทรัพย์ (Assets)</td>
                                </tr>
                                {assets.map(a => (
                                    <tr key={a.accountNumber} className="bg-white">
                                        <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                                        <td className="py-1 align-top">{a.accountName}</td>
                                        <td className="text-right px-4 py-1 align-top">{formatMoney(a.debit - a.credit)}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-muted">
                                    <td colSpan={3} className="px-4 py-2">หนี้สิน (Liabilities)</td>
                                </tr>
                                {liabilities.map(a => (
                                    <tr key={a.accountNumber} className="bg-white">
                                        <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                                        <td className="py-1 align-top">{a.accountName}</td>
                                        <td className="text-right px-4 py-1 align-top">{formatMoney(a.debit - a.credit)}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold bg-muted">
                                    <td colSpan={3} className="px-4 py-2">ทุน (Equity)</td>
                                </tr>
                                {equity.map(a => (
                                    <tr key={a.accountNumber} className="bg-white">
                                        <td className="pl-4 text-xs py-1 align-top whitespace-nowrap">{a.accountNumber}</td>
                                        <td className="py-1 align-top">{a.accountName}</td>
                                        <td className="text-right px-4 py-1 align-top">{formatMoney(a.debit + a.credit)}</td>
                                    </tr>
                                ))}
                                {/* Totals */}
                                <tr className="bg-primary text-primary-foreground font-bold text-lg">
                                    <td className="border-t border-b px-4 py-2">รวมสินทรัพย์</td>
                                    <td className="border-t border-b px-4 py-2"></td>
                                    <td className="border-t border-b text-right px-4 py-2">{formatMoney(sum(assets))}</td>
                                </tr>
                                <tr className="bg-primary text-primary-foreground font-bold text-lg">
                                    <td className="border-t border-b px-4 py-2">รวมหนี้สินและทุน</td>
                                    <td className="border-t border-b px-4 py-2"></td>
                                    <td className="border-t border-b text-right px-4 py-2">{formatMoney(-totalEquity)}</td>
                                </tr>
                                {/* Retained Earnings row */}
                                {retainedEarnings !== 0 && (
                                    <tr className="bg-muted font-bold">
                                        <td className="border-t px-4 py-2">กำไรขาดทุนสะสมยังไม่ปิดบัญชี (Retained Earnings)</td>
                                        <td className="border-t px-4 py-2"></td>
                                        <td className="border-t text-right px-4 py-2">{formatMoney(retainedEarnings)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </PrintWrapper>
        </div>
    );
};

export default BalanceSheetReport;
