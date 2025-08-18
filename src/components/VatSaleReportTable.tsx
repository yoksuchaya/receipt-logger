
import React, { useState } from "react";
import { formatMoney } from "./utils";
import ReceiptDetail from "./ReceiptDetail";
import ReceiptEditForm, { type ReceiptEditFormData } from "./ReceiptEditForm";

interface VatSale {
    date: string;
    receipt_no: string;
    buyer_name: string;
    buyer_tax_id: string;
    buyer_address: string;
    grand_total: number;
    vat: number;
    notes?: string;
}

interface VatSaleReportTableProps {
    data: VatSale[];
    sumExVat: number;
    sumVat: number;
    sumTotal: number;
}

const th = "border px-2 py-1 bg-gray-100 dark:bg-neutral-800";
const td = "border px-2 py-1 text-xs md:text-sm";
const tdRight = td + " text-right";

const VatSaleReportTable: React.FC<VatSaleReportTableProps> = ({ data, sumExVat, sumVat, sumTotal }) => {
    const [selected, setSelected] = useState<VatSale | null>(null);
    const [edit, setEdit] = useState(false);
    const [editForm, setEditForm] = useState<ReceiptEditFormData>({} as ReceiptEditFormData);

    if (selected) {
        return (
            <div className="w-full px-2 sm:px-0">
                <div className="mb-4">
                    <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs" onClick={() => { setSelected(null); setEdit(false); }}>ย้อนกลับ</button>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 sm:p-6 w-full">
                    <h3 className="text-lg font-bold mb-4">{edit ? 'แก้ไขใบเสร็จ' : 'รายละเอียดใบเสร็จ'}</h3>
                    {edit ? (
                        <ReceiptEditForm
                            editForm={editForm}
                            setEditForm={setEditForm}
                            onSave={async () => {
                                // You may want to implement save logic here
                                setSelected(null);
                                setEdit(false);
                            }}
                            onClose={() => { setSelected(null); setEdit(false); }}
                        />
                    ) : (
                        <ReceiptDetail
                            selected={selected}
                            onEdit={() => { setEdit(true); setEditForm(selected); }}
                            onDelete={async () => {
                                if (window.confirm('Delete this receipt?')) {
                                    // You may want to implement delete logic here
                                    setSelected(null);
                                    setEdit(false);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <table className="min-w-full text-xs md:text-sm border border-gray-300 dark:border-neutral-700">
            <thead>
                <tr className="bg-gray-100 dark:bg-neutral-800">
                    <th className={th}>ลำดับที่</th>
                    <th className={th}>วันที่</th>
                    <th className={th}>เลขที่เอกสาร/ใบกำกับภาษี</th>
                    <th className={th}>ชื่อผู้ซื้อ</th>
                    <th className={th}>เลขประจำตัวผู้เสียภาษีผู้ซื้อ</th>
                    <th className={th}>ที่อยู่ผู้ซื้อ</th>
                    <th className={th}>มูลค่าสินค้าหรือบริการ<br />(ไม่รวม VAT)</th>
                    <th className={th}>ภาษีมูลค่าเพิ่ม</th>
                    <th className={th}>รวมเงิน</th>
                    <th className={th}>หมายเหตุ</th>
                    <th className={th + " no-print"}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map((r, idx) => (
                    <tr key={idx}>
                        <td className={td + " text-center"}>{idx + 1}</td>
                        <td className={td + " text-center"}>{new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                        <td className={td}>{r.receipt_no}</td>
                        <td className={td}>{r.buyer_name}</td>
                        <td className={td}>{r.buyer_tax_id}</td>
                        <td className={td}>{r.buyer_address}</td>
                        <td className={tdRight}>{formatMoney(Number(r.grand_total) - Number(r.vat))}</td>
                        <td className={tdRight}>{formatMoney(r.vat)}</td>
                        <td className={tdRight}>{formatMoney(r.grand_total)}</td>
                        <td className={td}>{r.notes}</td>
                        <td className={td + " min-w-[120px] no-print"}>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 w-full sm:w-auto" onClick={() => { setSelected(r); setEdit(false); }}>ดูข้อมูล</button>
                                <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 w-full sm:w-auto" onClick={() => { setSelected(r); setEdit(true); setEditForm(r); }}>แก้ไข</button>
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
                <tr className="font-bold bg-gray-50 dark:bg-neutral-800">
                    <td className={td + " text-center"} colSpan={6}>รวมทั้งสิ้น</td>
                    <td className={tdRight}>{formatMoney(sumExVat)}</td>
                    <td className={tdRight}>{formatMoney(sumVat)}</td>
                    <td className={tdRight}>{formatMoney(sumTotal)}</td>
                    <td className={td}></td>
                    <td className={td}></td>
                </tr>
            </tfoot>
        </table>
    );
};

export default VatSaleReportTable;
