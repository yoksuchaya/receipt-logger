import { useState } from "react";
import { formatMoney } from "../utils/utils";
import ReceiptDetail from "../receipt/ReceiptDetail";
import ReceiptEditForm, { type ReceiptEditFormData } from "../receipt/ReceiptEditForm";

interface Purchase {
    date: string;
    receipt_no: string;
    vendor: string;
    vendor_tax_id: string;
    description: string;
    vat: number;
    grand_total: number;
    category: string;
    notes?: string;
}

interface Props {
    data: Purchase[];
    sumAmount: number;
    sumVat: number;
    sumTotal: number;
    onRowAction?: (row: Purchase, isEdit: boolean) => void;
}

const th = "font-bold bg-gray-100 text-gray-800 text-center border border-gray-300 px-2 py-1";
const td = "border border-gray-300 px-2 py-1 text-sm";
const tdRight = td + " text-right";

export default function VatPurchaseReportTable({ data, sumAmount, sumVat, sumTotal, onRowAction }: Props) {
    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-[14px] border border-gray-300">
                    <thead>
                        <tr>
                            <th className={th}>ลำดับที่</th>
                            <th className={th}>วันที่</th>
                            <th className={th}>เลขที่ใบกำกับภาษี / เลขที่ใบเสร็จ</th>
                            <th className={th}>ชื่อผู้ขาย</th>
                            <th className={th}>เลขประจำตัวผู้เสียภาษีผู้ขาย</th>
                            <th className={th}>ประเภทสินค้า/บริการ</th>
                            <th className={th}>มูลค่าสินค้า/บริการ (ไม่รวม VAT)</th>
                            <th className={th}>ภาษีมูลค่าเพิ่ม (7%)</th>
                            <th className={th}>จำนวนเงินรวม (รวม VAT)</th>
                            <th className={th}>หมายเหตุ</th>
                            <th className={th + " no-print"}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                <td className={td + " text-center"}>{i + 1}</td>
                                <td className={td + " text-center"}>{row.date || "-"}</td>
                                <td className={td + " text-center"}>{row.receipt_no || "-"}</td>
                                <td className={td}>{row.vendor || "-"}</td>
                                <td className={td + " text-center"}>{row.vendor_tax_id || "-"}</td>
                                <td className={td}>{row.category || "-"}</td>
                                <td className={tdRight}>{formatMoney(Number(row.grand_total) - Number(row.vat))}</td>
                                <td className={tdRight}>{formatMoney(row.vat)}</td>
                                <td className={tdRight}>{formatMoney(row.grand_total)}</td>
                                <td className={td}>{row.notes || "-"}</td>
                                <td className={td + " min-w-[120px] no-print"}>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 w-full sm:w-auto" onClick={() => onRowAction && onRowAction(row, false)}>ดูข้อมูล</button>
                                        <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 w-full sm:w-auto" onClick={() => onRowAction && onRowAction(row, true)}>แก้ไข</button>
                                        <button className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 w-full sm:w-auto" onClick={async () => {
                                            if (window.confirm('Delete this receipt?')) {
                                                // You may want to implement delete logic here
                                            }
                                        }}>ลบ</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className={td + " text-right"} colSpan={6}>รวม</td>
                            <td className={tdRight + " font-bold"}>{formatMoney(sumAmount)}</td>
                            <td className={tdRight + " font-bold"}>{formatMoney(sumVat)}</td>
                            <td className={tdRight + " font-bold"}>{formatMoney(sumTotal)}</td>
                            <td className={td + " no-print"}></td>
                            <td className={td}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
