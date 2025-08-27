import React, { useState } from 'react';
import IssueSaleReceiptForm from './IssueSaleReceiptForm';
import IssuePurchaseReceiptForm from './IssuePurchaseReceiptForm';
import JournalVoucher from './JournalVoucher';

const documentTypes = [
  { key: 'financial', label: 'เอกสารการเงิน' },
  { key: 'accounting', label: 'เอกสารบัญชี' },
];

const documentLists: Record<string, { key: string; label: string }[]> = {
  financial: [
    { key: 'issue-receipt', label: 'ใบกำกับภาษี / ใบเสร็จรับเงิน (ใบขาย)' },
    { key: 'payment-voucher', label: 'ใบสำคัญจ่าย (ใบซื้อ)' },
  ],
  accounting: [
    { key: 'journal-voucher', label: 'ใบสำคัญทั่วไป / ใบสำคัญ journal' },
    { key: 'cash-bill-cert', label: 'ใบรับรองบิลเงินสด' },
  ],
};

const IssueDocumentMenu: React.FC = () => {
  const [selectedType, setSelectedType] = useState('financial');
  const [selectedDoc, setSelectedDoc] = useState('issue-receipt');

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setSelectedType(type);
    setSelectedDoc(documentLists[type][0].key);
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDoc(e.target.value);
  };

  return (
    <div className="w-full flex flex-col gap-6 items-start">
      <div className="w-full flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="doc-type" className="block font-medium mb-1 text-gray-800 dark:text-gray-100">ประเภทเอกสาร</label>
          <select
            id="doc-type"
            value={selectedType}
            onChange={handleTypeChange}
            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {documentTypes.map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="doc-list" className="block font-medium mb-1 text-gray-800 dark:text-gray-100">รายการเอกสาร</label>
          <select
            id="doc-list"
            value={selectedDoc}
            onChange={handleDocChange}
            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {documentLists[selectedType].map((doc) => (
              <option key={doc.key} value={doc.key}>{doc.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Show form for selected document */}
      {selectedType === 'financial' && selectedDoc === 'issue-receipt' && (
        <div className="w-full">
          <IssueSaleReceiptForm />
        </div>
      )}
      {selectedType === 'financial' && selectedDoc === 'payment-voucher' && (
        <div className="w-full">
          <IssuePurchaseReceiptForm />
        </div>
      )}
      {selectedType === 'accounting' && selectedDoc === 'journal-voucher' && (
        <div className="w-full">
          <JournalVoucher />
        </div>
      )}
    </div>
  );
};

export default IssueDocumentMenu;
