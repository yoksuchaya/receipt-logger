import React, { useRef } from "react";

interface PrintWrapperProps {
  children: React.ReactNode;
  printLabel?: string; // For print window/document title
  printButtonLabel?: string; // For button text
}

/**
 * Wraps printable content and provides a print button and print logic with custom print CSS.
 * Usage: <PrintWrapper><div>...</div></PrintWrapper>
 */
const PrintWrapper: React.FC<PrintWrapperProps> = ({
  children,
  printLabel = "พิมพ์รายงาน",
  printButtonLabel = "พิมพ์รายงาน",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (!printWindow) return;
    // Copy all <link rel="stylesheet"> and <style> from the current document head
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.outerHTML)
      .join('');
    const styleTags = Array.from(document.querySelectorAll('style'))
      .map(style => style.outerHTML)
      .join('');
    printWindow.document.write(`<html><head><title>${printLabel}</title>${stylesheets}${styleTags}`);
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
          /* Always hide .no-print in print, with highest specificity */
          .no-print, .no-print * {
            display: none !important;
          }
          /* Print-safe flex utility: only apply to .print-flex, not all .flex */
          .print-flex {
            display: flex !important;
            flex-direction: row !important;
            gap: 0.5rem !important;
          }
          .print-scale table,
          .print-scale th,
          .print-scale td {
            font-size: 60% !important;
          }
          table, th, td {
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
          .print-scale .vat-table {
            margin-top: 32px !important;
            margin-bottom: 40px !important;
          }
          .print-scale .vat-signature {
            margin-top: 40px !important;
          }
          /* Ensure money columns align right and use monospace font in print */
          .text-right { text-align: right !important; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
          /* Remove overflow for print, so tables are not clipped */
          .overflow-x-auto, .overflow-x-auto * {
            overflow: visible !important;
            box-shadow: none !important;
            -webkit-overflow-scrolling: auto !important;
          }
          /* Page break for long tables */
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
        }
        /* Ensure images fit and are not cut off */
        .print-scale img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 0 auto;
          page-break-inside: avoid !important;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<div class="print-scale">${printContents}</div>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.onload = () => {
      const images = printWindow.document.images;
      const doPrint = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 100);
      };
      if (images.length === 0) {
        doPrint();
        return;
      }
      let loaded = 0;
      for (let img of images) {
        if (img.complete) {
          loaded++;
        } else {
          img.onload = img.onerror = () => {
            loaded++;
            if (loaded === images.length) {
              doPrint();
            }
          };
        }
      }
      if (loaded === images.length) {
        doPrint();
      }
    };
  };

  return (
    <div className="w-full max-w-full">
      <div className="flex justify-end mb-2 no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow"
        >
          {printButtonLabel}
        </button>
      </div>
      <div ref={printRef} className="print-content">
        {children}
      </div>
    </div>
  );
};

export default PrintWrapper;
