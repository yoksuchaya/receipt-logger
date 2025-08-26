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

export interface PaymentBankOption {
  value: string;
  label: string;
  shorts?: string;
}
export interface PaymentType {
  value: string;
  label: string;
}

export interface CompanyProfileData {
  company_name: string;
  address: string;
  tax_id: string;
  phones: string[];
  productOptions?: Record<string, string[]>;
  productCategoryNames?: Record<string, string>;
  productCategoryShorts?: Record<string, string>;
  paymentTypes?: PaymentType[];
  paymentBankOptions?: PaymentBankOption[];
}

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
  // Only track which section is selected for nav highlight
  const [selectedSection, setSelectedSection] = useState<'basic' | 'bank' | 'product'>('basic');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSelectedSection(id as any);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 md:px-0 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 tracking-tight">ตั้งค่าข้อมูลบริษัท</h1>
        <p className="text-gray-500 dark:text-gray-300 text-sm">จัดการข้อมูลพื้นฐาน ช่องทางรับชำระเงิน และหมวดสินค้าของบริษัท</p>
      </div>
      {/* Sticky navigation bar */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-100 dark:border-neutral-800 mb-8 flex gap-2 px-2 py-3 min-h-[3.25rem] overflow-x-auto whitespace-nowrap scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button onClick={() => scrollToSection('basic')} className={`px-3 py-1 rounded font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedSection === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-neutral-700'}`}>ข้อมูลบริษัท</button>
        <button onClick={() => scrollToSection('bank')} className={`px-3 py-1 rounded font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedSection === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-neutral-700'}`}>ช่องทางรับชำระ/ธนาคาร</button>
        <button onClick={() => scrollToSection('product')} className={`px-3 py-1 rounded font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedSection === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-neutral-700'}`}>ตัวเลือกสินค้า</button>
      </nav>
      <div className="space-y-8">
        {loading && <div className="text-gray-500 dark:text-gray-300">กำลังโหลดข้อมูล...</div>}
        {error && <div className="text-red-500 dark:text-red-400">{error}</div>}
        {company && !loading && !error && (
          <>
            {/* ข้อมูลบริษัท */}
            <section id="basic" className="bg-white dark:bg-neutral-900 rounded-xl shadow border border-gray-100 dark:border-neutral-800 mx-2 p-6 scroll-mt-20">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" aria-hidden="true"></span>
                ข้อมูลบริษัท
              </h2>
              <CompanyBasicInfo
                company={company}
                editingBasic={editingBasic}
                editData={editData}
                setEditingBasic={setEditingBasic}
                setEditData={setEditData}
                setCompany={setCompany}
              />
            </section>
            {/* ช่องทางรับชำระ/ธนาคาร */}
            <section id="bank" className="bg-white dark:bg-neutral-900 rounded-xl shadow border border-gray-100 dark:border-neutral-800 mx-2 p-6 scroll-mt-20">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" aria-hidden="true"></span>
                ช่องทางรับชำระ/ธนาคาร
              </h2>
              <CompanyBankOptions
                company={company}
                setCompany={setCompany}
                receipts={receipts}
              />
            </section>
            {/* ตัวเลือกสินค้า */}
            <section id="product" className="bg-white dark:bg-neutral-900 rounded-xl shadow border border-gray-100 dark:border-neutral-800 mx-2 p-6 scroll-mt-20">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2" aria-hidden="true"></span>
                ตัวเลือกสินค้า
              </h2>
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
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
