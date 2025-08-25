import React, { useEffect, useState } from "react";
import CompanyBasicInfo from "./CompanyBasicInfo";
import CompanyProductOptions from "./CompanyProductOptions";
import CompanyBankOptions from "./CompanyBankOptions";
// Fetch receipts from API and cache in state
function useReceipts() {
  const [receipts, setReceipts] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/receipt-log')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReceipts(data);
        else if (Array.isArray(data?.receipts)) setReceipts(data.receipts);
      });
  }, []);
  return receipts;
}

function isCategoryUsed(category: string, receipts: any[], productCategoryNames?: Record<string, string>): boolean {
  const displayName = productCategoryNames?.[category] || category;
  return receipts.some((r: any) => r.category === displayName);
}

function isBankUsed(bankValue: string, receipts: any[]): boolean {
  return receipts.some((r: any) => r.bank === bankValue);
}

export interface PaymentBankOption {
  value: string;
  label: string;
  shorts?: string;
}

export interface CompanyProfileData {
  company_name: string;
  address: string;
  tax_id: string;
  phones: string[];
  productOptions?: Record<string, string[]>;
  productCategoryNames?: Record<string, string>;
  productCategoryShorts?: Record<string, string>;
  paymentBankOptions?: PaymentBankOption[];
}
// (stray line removed)
const CompanyProfile: React.FC = () => {
  const [company, setCompany] = useState<CompanyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editData, setEditData] = useState<CompanyProfileData | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatOpts, setNewCatOpts] = useState('');
  const [newCatShort, setNewCatShort] = useState('');
  // For payment bank add form
  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankShort, setNewBankShort] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/company-profile")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("ไม่พบข้อมูลบริษัท");
        }
        return res.json();
      })
      .then((data) => {
        setCompany(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "เกิดข้อผิดพลาด");
        setLoading(false);
      });
  }, []);

  const receipts = useReceipts();
  return (
    <div className="w-full mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 md:p-8 text-base border border-gray-100 dark:border-neutral-800">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">ข้อมูลบริษัท</h2>
      {loading && <div className="text-gray-500 dark:text-gray-300">กำลังโหลดข้อมูล...</div>}
      {error && <div className="text-red-500 dark:text-red-400">{error}</div>}
      {company && !loading && !error && (
        <>
          <CompanyBasicInfo
            company={company}
            editingBasic={editingBasic}
            editData={editData}
            setEditingBasic={setEditingBasic}
            setEditData={setEditData}
            setCompany={setCompany}
          />
          <CompanyBankOptions
            company={company}
            editingBank={editingBank}
            editData={editData}
            setEditingBank={setEditingBank}
            setEditData={setEditData}
            setCompany={setCompany}
            receipts={receipts}
            newBankLabel={newBankLabel}
            setNewBankLabel={setNewBankLabel}
            newBankShort={newBankShort}
            setNewBankShort={setNewBankShort}
          />
          <CompanyProductOptions
            company={company}
            editingProduct={editingProduct}
            editData={editData}
            setEditingProduct={setEditingProduct}
            setEditData={setEditData}
            setCompany={setCompany}
            receipts={receipts}
            newCatName={newCatName}
            setNewCatName={setNewCatName}
            newCatOpts={newCatOpts}
            setNewCatOpts={setNewCatOpts}
            newCatShort={newCatShort}
            setNewCatShort={setNewCatShort}
          />
        </>
      )}
    </div>
  );
};

export default CompanyProfile;
