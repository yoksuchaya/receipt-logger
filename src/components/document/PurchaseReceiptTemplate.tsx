import { numberToThaiText } from "../utils/numberToThaiText";
import React, { useEffect, useState } from "react";

interface PurchaseReceiptTemplateProps {
  data: Record<string, any>;
  className?: string;
}

const PurchaseReceiptTemplate: React.FC<PurchaseReceiptTemplateProps> = ({ data, className }) => {
  const [company, setCompany] = useState<any>(null);
  const [bankOptions, setBankOptions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/company-profile')
      .then(res => res.json())
      .then(profile => {
        setCompany(profile);
        setBankOptions(profile.paymentBankOptions || []);
      })
      .catch(() => {
        setCompany(null);
        setBankOptions([]);
      });
  }, []);

  // Calculate price before VAT once and reuse
  const priceBeforeVat = Number((data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)) - (Number(data.vat) || 0));
  return (
    <div className={`w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 my-4 ${className || ''}`}>
      <div className="flex flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-neutral-700 p-4 md:p-6 gap-4 w-full">
        <div className="max-w-xs break-words whitespace-pre-line">
          <div className="font-bold text-lg md:text-xl text-gray-800 dark:text-gray-100">{company?.company_name || 'ชื่อร้าน'}</div>
          {company?.address && <div className="text-xs text-gray-500 dark:text-gray-400">{company.address}</div>}
          <div className="text-xs text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษีอากร: {company?.tax_id || '-'}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-base md:text-lg text-gray-700 dark:text-gray-200">ใบรับซื้อทองเก่า / ใบสำคัญการจ่ายเงิน</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">เลขที่ (No.): {data.receipt_no || '-'}</div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4 w-full pt-2 pb-2">
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800">
          <div className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">ข้อมูลผู้ขาย</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="text-gray-500 dark:text-gray-400">ชื่อผู้ขาย</div><div>{data.vendor || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ที่อยู่</div><div>{data.vendor_address || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษี / เลขบัตรประชาชน</div><div>{data.vendor_tax_id || '-'}</div>
          </div>
        </div>
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800">
          <div className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">รายละเอียดเอกสาร</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="text-gray-500 dark:text-gray-400">วันที่</div><div>{data.date || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ราคารูปพรรณรับซื้อคืนต่อบาท</div><div>{data.jewelryBuyBackPricePerBaht || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ราคารูปพรรณรับซื้อคืนต่อกรัม</div><div>{data.jewelryBuyBackPricePerGram || '-'}</div>
          </div>
        </div>
      </div>
      <div className="my-4 text-center font-semibold text-xs">
        ข้าพเจ้าขอรับรองว่าเป็นสมบัติของข้าพเจ้าโดยแท้จริง และขอรับรองว่าสิ่งของที่นำมาขายนั้นเป็นของที่บริสุทธิ์<br />
        ถ้าหากเป็นของที่ทุจริตแล้ว ข้าพเจ้าจะขอรับผิดชอบทั้งสิ้น และได้อ่านทบทวนเรียบร้อยแล้ว จึงลงนามไว้เป็นหลักฐาน
      </div>
      <div className="overflow-x-auto w-full pt-2 pb-2">
        <table className="min-w-full text-xs rounded-lg overflow-hidden mb-4">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">ลำดับ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">รายการ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">น้ำหนัก (กรัม)</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const products = data.products || [];
              const rows = products.map((p: any, i: number) => (
                <tr key={i}>
                  <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">{i + 1}</td>
                  <td className="p-2 border border-gray-200 dark:border-neutral-700">{p.name || ''}</td>
                  <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">{p.weight ?? ''}</td>
                  <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">{Number(p.price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ));
              for (let i = products.length; i < 6; i++) {
                rows.push(
                  <tr key={`empty-${i}`}>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-sans">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-sans">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-sans">&nbsp;</td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-2 border border-gray-200 text-right font-semibold font-sans" colSpan={2}>รวมสุทธิ</td>
              <td className="p-2 border border-gray-200 text-center font-semibold font-sans">
                {Number((data.products || []).reduce((sum: number, p: any) => sum + (Number(p.weight) || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 border border-gray-200 text-center font-semibold  font-sans">
                {Number(data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td className="p-2 pt-4 border border-gray-200 text-center italic text-sm dark:text-gray-400" colSpan={6}>
                (ตัวอักษร) {numberToThaiText(Number(data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid grid-cols-12 gap-4 w-full pt-2 pb-2">
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800 flex flex-col">
          <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-2">ช่องทางรับชำระ</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            {/* Payment methods */}
            {data.payment ? (
              Object.entries(data.payment).map(([k, v]) => {
                // Build paymentLabels from company?.paymentTypes if available
                const paymentLabels: Record<string, string> = (company?.paymentTypes || []).reduce((acc: Record<string, string>, cur: any) => {
                  acc[cur.value] = cur.label;
                  return acc;
                }, {});
                return [
                  <div key={k + '-label'} className="text-gray-500 dark:text-gray-400">{paymentLabels[k] || k}</div>,
                  <div key={k + '-value'} className="text-gray-700 dark:text-gray-200">{Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
                ];
              })
            ) : [
              <div key="payment-label" className="text-gray-500 dark:text-gray-400">-</div>,
              <div key="payment-value" className="text-gray-700 dark:text-gray-200">-</div>
            ]}
            {/* Bank info */}
            {data.bank && data.bank !== 'cash' && [
              <div key="bank-label" className="text-gray-500 dark:text-gray-400">บัญชีธนาคาร</div>,
              <div key="bank-value" className="text-gray-700 dark:text-gray-200">
                {bankOptions.find((b: any) => b.value === data.bank)?.label || data.bank}
              </div>
            ]}
          </div>
        </div>
      </div>
      <div className="pb-6 w-full">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้รับเงิน / Customer</span></div>
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้ซื้อ / Cashier</span></div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseReceiptTemplate;
