import { numberToThaiText } from "../utils/numberToThaiText";
import React, { useEffect, useState } from "react";

interface SaleReceiptTemplateProps {
  data: Record<string, any>;
  className?: string;
}

const SaleReceiptTemplate: React.FC<SaleReceiptTemplateProps> = ({ data, className }) => {
  const [company, setCompany] = useState<{ company_name?: string; tax_id?: string; address_line?: string } | null>(null);

  useEffect(() => {
    fetch('/api/company-profile')
      .then(res => res.json())
      .then(setCompany)
      .catch(() => setCompany(null));
  }, []);

  // Calculate price before VAT once and reuse
  const priceBeforeVat = Number((data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)) - (Number(data.vat) || 0));
  return (
    <div className={`w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 my-4 ${className || ''}`}>
      <div className="flex flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-neutral-700 p-4 md:p-6 gap-4 w-full">
        <div className="max-w-xs break-words whitespace-pre-line">
          <div className="font-bold text-lg md:text-xl text-gray-800 dark:text-gray-100">{company?.company_name || 'ชื่อร้าน'}</div>
          {company?.address_line && <div className="text-xs text-gray-500 dark:text-gray-400">{company.address_line}</div>}
          <div className="text-xs text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษีอากร: {company?.tax_id || '-'}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-base md:text-lg text-gray-700 dark:text-gray-200">ใบเสร็จรับเงิน / ใบกำกับภาษี</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">เลขที่ (No.): {data.receipt_no || '-'}</div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4 w-full pt-2 pb-2">
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800">
          <div className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">ข้อมูลผู้ซื้อ</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="text-gray-500 dark:text-gray-400">ชื่อผู้ซื้อ</div><div>{data.buyer_name || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ที่อยู่</div><div>{data.buyer_address || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">เลขประจำตัวผู้เสียภาษี</div><div>{data.buyer_tax_id || '-'}</div>
          </div>
        </div>
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800">
          <div className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">รายละเอียดเอกสาร</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="text-gray-500 dark:text-gray-400">วันที่ขาย</div><div>{data.date || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ราคาทองแท่งขายออก</div><div>{data.goldBarSalePrice || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ราคารูปพรรณรับซื้อคืนต่อบาท</div><div>{data.jewelryBuyBackPricePerBaht || '-'}</div>
            <div className="text-gray-500 dark:text-gray-400">ราคารูปพรรณรับซื้อคืนต่อกรัม</div><div>{data.jewelryBuyBackPricePerGram || '-'}</div>

          </div>
        </div>
      </div>
      <div className="overflow-x-auto w-full pt-2 pb-2">
        <table className="min-w-full text-xs rounded-lg overflow-hidden mb-4">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">ลำดับ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">รายการ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">น้ำหนัก (กรัม)</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">จำนวน</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700 font-sans">ราคาต่อหน่วย</th>
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
                  <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">{p.quantity ?? ''}</td>
                  <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">{Number(p.pricePerItem || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
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
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-sans">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-sans">&nbsp;</td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-semibold font-sans" colSpan={2}>รวมน้ำหนัก (กรัม)</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-semibold font-sans">
                {Number((data.products || []).reduce((sum: number, p: any) => sum + (Number(p.weight) || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-sans">&nbsp;</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-sans">&nbsp;</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-sans">&nbsp;</td>
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
                const paymentLabels: Record<string, string> = (company && (company as any).paymentTypes || []).reduce((acc: Record<string, string>, cur: any) => {
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
                {(() => {
                  // Use paymentBankOptions from company profile (fetched above)
                  const paymentBankOptions = (company && (company as any).paymentBankOptions) || [];
                  const found = paymentBankOptions.find((b: any) => b.value === data.bank);
                  return found ? found.label : data.bank;
                })()}
              </div>
            ]}
          </div>
        </div>
        <div className="col-span-6 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800 flex flex-col">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="label text-gray-500 dark:text-gray-400">ราคาสินค้าก่อนรวมภาษีมูลค่าเพิ่ม</td>
                <td className="num text-right text-gray-700 dark:text-gray-200">{priceBeforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td className="label text-gray-500 dark:text-gray-400">หัก ราคาทองรูปพรรณ์รับคืน</td>
                <td className="num text-right text-gray-700 dark:text-gray-200">0.00</td>
              </tr>
              <tr>
                <td className="label text-gray-500 dark:text-gray-400">ส่วนต่างฐานภาษี</td>
                <td className="num text-right text-gray-700 dark:text-gray-200">{
                  (() => {
                    const ornamentBuy = Number(data.ornamentBuy) || 0;
                    return (priceBeforeVat - ornamentBuy).toLocaleString('th-TH', { minimumFractionDigits: 2 });
                  })()
                }</td>
              </tr>
              <tr>
                <td className="label text-gray-500 dark:text-gray-400">ภาษีมูลค่าเพิ่ม (VAT)</td>
                <td className="num text-right text-gray-700 dark:text-gray-200">{data.vat ? Number(data.vat).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}</td>
              </tr>
              <tr>
                <td className="label text-gray-700 dark:text-gray-200 font-semibold">รวมจำนวนเงินสุทธิ</td>
                <td className="num text-right text-gray-900 dark:text-white font-bold">{Number(data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              </tr>
              {/* Grand total spell out in Thai */}
            <tr>
              <td className="p-2 pt-4 text-center italic text-sm dark:text-gray-400" colSpan={6}>
                (ตัวอักษร) {numberToThaiText(Number(data.grand_total || (data.products || []).reduce((sum: number, p: any) => sum + Number(p.price || 0), 0)))}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="pb-6 w-full">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้รับเงิน / Cashier</span></div>
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้ซื้อ / Customer</span></div>
        </div>
      </div>
    </div>
  );
}

export default SaleReceiptTemplate;
