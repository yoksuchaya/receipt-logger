import React, { useEffect, useState } from "react";

interface SaleReceiptTemplateProps {
  data: Record<string, any>;
  className?: string;
}

const SaleReceiptTemplate: React.FC<SaleReceiptTemplateProps> = ({ data, className }) => {
  const [company, setCompany] = useState<{ company_name?: string; tax_id?: string; address?: string } | null>(null);

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
          {company?.address && <div className="text-xs text-gray-500 dark:text-gray-400">{company.address}</div>}
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
              <th className="p-2 border border-gray-200 dark:border-neutral-700">ลำดับ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700">รายการ</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700">น้ำหนัก (กรัม)</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700">จำนวน</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700">ราคาต่อหน่วย</th>
              <th className="p-2 border border-gray-200 dark:border-neutral-700">จำนวนเงิน</th>
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
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">&nbsp;</td>
                    <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">&nbsp;</td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right font-semibold" colSpan={2}>รวมน้ำหนัก (กรัม)</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center font-semibold">
                {Number((data.products || []).reduce((sum: number, p: any) => sum + (Number(p.weight) || 0), 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-center">&nbsp;</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">&nbsp;</td>
              <td className="p-2 border border-gray-200 dark:border-neutral-700 text-right">&nbsp;</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 pb-4 w-full">
        <div className="col-start-7 col-span-7 items-end">
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-100 dark:border-neutral-800 w-full md:w-[340px]">
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="pb-6 w-full">
        <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-2">ช่องทางรับชำระ:
          <span className="text-gray-700 dark:text-gray-200 block">
            {data.payment ? (
              Object.entries(data.payment).map(([k, v]) => {
                const paymentLabels: Record<string, string> = {
                  cash: 'เงินสด',
                  credit_card: 'บัตรเครดิต',
                  transfer: 'เงินโอน',
                };
                return (
                  <div key={k}>
                    {paymentLabels[k] || k}: {Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                  </div>
                );
              })
            ) : '-'}
          </span>
          {data.bank && data.bank !== 'cash' && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-200">บัญชีธนาคาร: </span>
              <span className="text-gray-700 dark:text-gray-200">
                {(() => {
                  const bankMap: Record<string, string> = {
                    ks: 'กรุงศรี',
                    kbank: 'กสิกร',
                    scb: 'ไทยพาณิชย์',
                    aeon: 'อิออน',
                  };
                  return bankMap[data.bank] || data.bank;
                })()}
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้รับเงิน / Cashier</span></div>
          <div className="h-20 border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex items-end p-2"><span className="text-xs text-gray-400">ผู้ซื้อ / Customer</span></div>
        </div>
      </div>
    </div>
  );
}

export default SaleReceiptTemplate;
