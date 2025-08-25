import React, { useState, useEffect } from "react";
import SaleReceiptTemplate from "./SaleReceiptTemplate";
import PrintWrapper from "../layout/PrintWrapper";
import { MagnifyingGlassPlusIcon, XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";

interface ReceiptPreviewProps {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  className?: string;
  systemGenerated?: boolean;
  receiptData?: Record<string, any>;
}


const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ fileUrl, fileType, fileName, className, systemGenerated, receiptData }) => {
  const [showZoom, setShowZoom] = useState(false);
  const [templateData, setTemplateData] = useState<Record<string, any> | null>(null);
  const data = receiptData || templateData || {};

  useEffect(() => {
    if (systemGenerated && !fileUrl && !receiptData) {
      fetch('/sample-system-receipt.json')
        .then(res => res.json())
        .then(setTemplateData)
        .catch(() => setTemplateData(null));
    }
  }, [systemGenerated, fileUrl, receiptData]);


  if (!fileUrl && !systemGenerated) return null;

  return (
    <div className={`relative mt-2 mx-auto mb-6 ${className || ''}`}>
      {systemGenerated && !fileUrl && (
        <div
          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3 cursor-zoom-in hover:shadow transition-all overflow-hidden"
          style={{ minHeight: 120 }}
          onClick={() => setShowZoom(true)}
          tabIndex={0}
          role="button"
          aria-label="ดูใบเสร็จขนาดใหญ่"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowZoom(true); }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">ใบเสร็จสร้างโดยระบบ</span>
          </div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">{data.vendor || 'ชื่อร้าน'}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">วันที่: {data.date || '-'}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">เอกสารเลขที่: {data.receipt_no || '-'}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">ยอดรวม {Number(data.grand_total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</div>
        </div>
      )}
      {fileType.startsWith('image/') && fileUrl && (
        <>
          <img
            src={fileUrl}
            alt={fileName}
            className="rounded-lg object-contain border border-gray-200 dark:border-neutral-700 w-full max-w-full h-auto bg-gray-50 dark:bg-neutral-800 cursor-zoom-in"
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '16rem' }}
            onClick={() => setShowZoom(true)}
          />
          <button
            type="button"
            className="absolute bottom-2 right-2 bg-white bg-opacity-90 rounded-full p-2 shadow hover:bg-opacity-100 focus:outline-none"
            onClick={() => setShowZoom(true)}
            aria-label="Zoom"
            style={{ lineHeight: 0 }}
          >
            <MagnifyingGlassPlusIcon className="w-6 h-6 text-gray-700" />
          </button>
        </>
      )}
      {showZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowZoom(false)}>
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              className="text-white bg-black bg-opacity-80 rounded-full p-3 shadow-lg hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={() => setShowZoom(false)}
              aria-label={systemGenerated && !fileUrl ? 'ปิดใบเสร็จขนาดใหญ่' : 'Close preview'}
              style={{ fontSize: 0 }}
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
          </div>
          <div className="relative max-w-full max-h-full p-4 overflow-auto bg-white print:bg-transparent print:p-0 print:overflow-visible" onClick={e => e.stopPropagation()}>
            <PrintWrapper printLabel={`ใบเสร็จรับเงิน/ใบกำกับภาษีเลขที่ ${data.receipt_no || ''}`} printButtonLabel="พิมพ์ใบเสร็จ" printFontSizePercent={90}>
              {systemGenerated && !fileUrl ? (
                <SaleReceiptTemplate data={data} />
              ) : (
                <img
                  src={fileUrl}
                  alt="Receipt large preview"
                  className="rounded-lg object-contain max-w-full max-h-[80vh] print:!block print:!w-full print:!max-w-none print:!max-h-none print:visible print:opacity-100"
                  style={{ maxWidth: '90vw', maxHeight: '80vh', printColorAdjust: 'exact', visibility: 'visible' }}
                />
              )}
            </PrintWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptPreview;
