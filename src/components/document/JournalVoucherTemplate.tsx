import React, { useEffect, useState } from "react";

interface JournalVoucherTemplateProps {
    data: Record<string, any>;
    className?: string;
}

const JournalVoucherTemplate: React.FC<JournalVoucherTemplateProps> = ({ data, className }) => {
    const [company, setCompany] = useState<any>(null);
    const [accountChart, setAccountChart] = useState<any>(null);

    useEffect(() => {
        fetch('/api/company-profile')
            .then(res => res.json())
            .then(profile => setCompany(profile))
            .catch(() => setCompany(null));
        fetch('/api/account-chart')
            .then(res => res.json())
            .then(chart => setAccountChart(chart))
            .catch(() => setAccountChart(null));
    }, []);

    // Helper to get account name from account number
    const getAccountName = (account: string) => {
        if (!accountChart?.accounts) return account;
        const accNum = account.split('-')[0];
        const found = accountChart.accounts.find((a: any) => a.accountNumber === accNum);
        return found ? `${found.accountNumber} - ${found.accountName}` : account;
    };

    // Prepare journal entries from data.products or data.entries
    const entries = (data.entries && data.entries.length > 0)
        ? data.entries
        : (data.products || []).map((p: any) => {
            // Heuristic: 3xxx/4xxx = credit, else debit
            const price = Number(p.pricePerItem) || 0;
            let isCredit = false;
            if (typeof p.name === 'string' && (p.name.startsWith('3') || p.name.startsWith('4'))) {
                isCredit = true;
            }
            return {
                account: p.name || '',
                description: p.description || '',
                debit: isCredit ? 0 : price,
                credit: isCredit ? price : 0,
            };
        });

    return (
        <div className={`w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 my-4 ${className || ''}`}>
            <div className="flex flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-neutral-700 p-4 md:p-6 gap-4 w-full">
                <div className="max-w-xs break-words whitespace-pre-line">
                    <div className="font-bold text-lg md:text-xl text-gray-800 dark:text-gray-100">{company?.company_name || 'ชื่อร้าน'}</div>
                    {company?.address_line && <div className="text-xs text-gray-500 dark:text-gray-400">{company.address_line}</div>}
                    <div className="text-xs text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษีอากร: {company?.tax_id || '-'}</div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-base md:text-lg text-gray-700 dark:text-gray-200">ใบสำคัญทั่วไป (Journal Voucher)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">เลขที่ (No.): {data.receipt_no || '-'}</div>
                </div>
            </div>
            <div className="w-full pt-2 pb-2">
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800 my-4">
                    <div className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">รายละเอียดเอกสาร</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <div className="text-gray-500 dark:text-gray-400">วันที่</div><div>{data.date || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">หมวดหมู่</div><div>{data.category || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">หมายเหตุ</div><div>{data.notes || '-'}</div>
                    </div>
                </div>
            </div>
            <div className="my-4">
                <table className="w-full text-sm border rounded-lg bg-white dark:bg-neutral-900">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-neutral-800">
                            <th className="p-2 border border-gray-200 dark:border-neutral-700">บัญชี</th>
                            <th className="p-2 border border-gray-200 dark:border-neutral-700">รายละเอียด</th>
                            <th className="p-2 border border-gray-200 dark:border-neutral-700 text-right">เดบิต</th>
                            <th className="p-2 border border-gray-200 dark:border-neutral-700 text-right">เครดิต</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry: any, idx: number) => (
                            <tr key={idx}>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1">{getAccountName(entry.account)}</td>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1">{entry.description || '-'}</td>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{Number(entry.debit).toLocaleString()}</td>
                                <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{Number(entry.credit).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 dark:bg-neutral-800 font-semibold">
                            <td colSpan={2} className="border border-gray-200 dark:border-neutral-700 p-1 text-right">รวม</td>
                            <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{entries.reduce((sum: number, e: any) => sum + Number(e.debit), 0).toLocaleString()}</td>
                            <td className="border border-gray-200 dark:border-neutral-700 p-1 text-right">{entries.reduce((sum: number, e: any) => sum + Number(e.credit), 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                {/* Signature section below summary, print only */}
                <div className="pb-6 w-full">
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้จัดทำ</span></div>
                        <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้อนุมัติ</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalVoucherTemplate;
