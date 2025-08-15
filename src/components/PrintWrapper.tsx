import React, { useRef } from "react";

interface PrintWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps printable content and provides a print button and print logic with custom print CSS.
 * Usage: <PrintWrapper><div>...</div></PrintWrapper>
 */
const PrintWrapper: React.FC<PrintWrapperProps> = ({ children }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write(`
      <style>
        @media print {
          body { background: white; margin: 0; }
          .print-scale {
            width: 100%;
            margin: 0 auto;
            padding: 10mm 10mm 10mm 10mm;
            box-sizing: border-box;
            background: white;
            font-size: 60% !important;
          }
          .no-print { display: none !important; }
          .print-scale table,
          .print-scale th,
          .print-scale td {
            font-size: 60% !important;
          }
          table, th, td {
            border: 1px solid #333 !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 4px 8px !important;
          }
          .border-b.border-dashed {
            border-bottom-style: dashed !important;
            border-bottom-width: 1px !important;
            border-bottom-color: #888 !important;
            min-width: 220px !important;
            display: inline-block !important;
          }
          .print-scale .vat-header {
            margin-bottom: 32px !important;
          }
          .print-scale .vat-table {
            margin-bottom: 40px !important;
          }
          .print-scale .vat-signature {
            margin-top: 40px !important;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<div class="print-scale">${printContents}</div>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="w-full max-w-full">
      <div className="flex justify-end mb-2 no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow"
        >
          พิมพ์รายงาน
        </button>
      </div>
      <div ref={printRef} className="print-content">
        {children}
      </div>
    </div>
  );
};

export default PrintWrapper;
