import React from "react";
import { formatMoney } from "./utils";

interface VatSaleReportTableProps {
    data: any[];
    sumExVat: number;
    sumVat: number;
    sumTotal: number;
}


const VatSaleReportTable: React.FC<VatSaleReportTableProps> = ({ data, sumExVat, sumVat, sumTotal }) => (
    <table className="min-w-full text-xs md:text-sm border border-gray-300 dark:border-neutral-700">
        <thead>
            <tr className="bg-gray-100 dark:bg-neutral-800">
                <th className="border px-2 py-1">ลำดับที่</th>
                <th className="border px-2 py-1">วันที่</th>
                <th className="border px-2 py-1">เลขที่เอกสาร/ใบกำกับภาษี</th>
                <th className="border px-2 py-1">ชื่อผู้ซื้อ</th>
                <th className="border px-2 py-1">เลขประจำตัวผู้เสียภาษีผู้ซื้อ</th>
                <th className="border px-2 py-1">ที่อยู่ผู้ซื้อ</th>
                <th className="border px-2 py-1">มูลค่าสินค้าหรือบริการ<br />(ไม่รวม VAT)</th>
                <th className="border px-2 py-1">ภาษีมูลค่าเพิ่ม</th>
                <th className="border px-2 py-1">รวมเงิน</th>
                <th className="border px-2 py-1">หมายเหตุ</th>
            </tr>
        </thead>
        <tbody>
            {data.map((r, idx) => (
                <tr key={idx}>
                    <td className="border px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border px-2 py-1 text-center">{new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                    <td className="border px-2 py-1">{r.receipt_no}</td>
                    <td className="border px-2 py-1">{r.buyer_name}</td>
                    <td className="border px-2 py-1">{r.buyer_tax_id}</td>
                    <td className="border px-2 py-1">{r.buyer_address}</td>
                    <td className="border px-2 py-1 text-right">{formatMoney(Number(r.grand_total) - Number(r.vat))}</td>
                    <td className="border px-2 py-1 text-right">{formatMoney(r.vat)}</td>
                    <td className="border px-2 py-1 text-right">{formatMoney(r.grand_total)}</td>
                    <td className="border px-2 py-1">{r.notes}</td>
                </tr>
            ))}
        </tbody>
        <tfoot>
            <tr className="font-bold bg-gray-50 dark:bg-neutral-800">
                <td className="border px-2 py-1 text-center" colSpan={6}>รวมทั้งสิ้น</td>
                <td className="border px-2 py-1 text-right">{formatMoney(sumExVat)}</td>
                <td className="border px-2 py-1 text-right">{formatMoney(sumVat)}</td>
                <td className="border px-2 py-1 text-right">{formatMoney(sumTotal)}</td>
                <td className="border px-2 py-1"></td>
            </tr>
        </tfoot>
    </table>
);

export default VatSaleReportTable;
