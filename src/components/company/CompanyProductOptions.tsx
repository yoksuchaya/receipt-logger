import React from "react";
import { CompanyProfileData } from "./CompanyProfile";

interface Props {
  company: CompanyProfileData;
  editingProduct: boolean;
  editData: CompanyProfileData | null;
  setEditingProduct: (v: boolean) => void;
  setEditData: React.Dispatch<React.SetStateAction<CompanyProfileData | null>>;
  setCompany: (d: CompanyProfileData) => void;
  receipts: any[];
  newCatName: string;
  setNewCatName: (v: string) => void;
  newCatOpts: string;
  setNewCatOpts: (v: string) => void;
  newCatShort: string;
  setNewCatShort: (v: string) => void;
}

function isCategoryUsed(category: string, receipts: any[], productCategoryNames?: Record<string, string>): boolean {
  const displayName = productCategoryNames?.[category] || category;
  return receipts.some((r: any) => r.category === displayName);
}

const CompanyProductOptions: React.FC<Props> = ({ company, editingProduct, editData, setEditingProduct, setEditData, setCompany, receipts, newCatName, setNewCatName, newCatOpts, setNewCatOpts, newCatShort, setNewCatShort }) => {
  if (!company.productOptions) return null;
  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 mt-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">ตัวเลือกสินค้า</span>
        {!editingProduct && (
          <button
            className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            onClick={() => {
              setEditingProduct(true);
              setEditData({ ...company });
            }}
            aria-label="แก้ไขตัวเลือกสินค้า"
          >
            แก้ไข
          </button>
        )}
      </div>
      {!editingProduct ? (
        <div className="overflow-x-auto">
          <table className="min-w-[320px] w-full border border-gray-200 dark:border-neutral-700 rounded text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800">
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">หมวดสินค้า (Category)</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">รหัส (Short)</th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ตัวเลือกในหมวด (Options in Category)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(company.productOptions).map(([cat, opts]) => (
                <tr key={cat} className="border-t border-gray-100 dark:border-neutral-800">
                  <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                    {company.productCategoryNames?.[cat] || cat}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                    {company.productCategoryShorts?.[cat] || '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    {opts.length > 0 ? opts.join(', ') : <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            if (!editData) return;
            try {
              const res = await fetch('/api/company-profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
              });
              if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
              setCompany(editData);
              setEditingProduct(false);
            } catch (err: any) {
              alert(err.message || 'เกิดข้อผิดพลาด');
            }
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[320px] w-full border border-gray-200 dark:border-neutral-700 rounded text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800">
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">หมวดสินค้า (Category)</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">รหัส (Short)</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-left whitespace-nowrap">ตัวเลือกในหมวด (Options in Category)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(editData?.productOptions || {}).map(([cat, opts], idx) => {
                  const used = isCategoryUsed(cat, receipts, editData?.productCategoryNames);
                  return (
                    <tr key={cat} className="border-t border-gray-100 dark:border-neutral-800">
                      <td className="px-3 py-2">
                        <label htmlFor={`cat-name-${cat}`} className="sr-only">หมวดสินค้า</label>
                        <input
                          id={`cat-name-${cat}`}
                          className="rounded border border-gray-300 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition disabled:bg-gray-100 disabled:dark:bg-neutral-800 disabled:text-gray-400"
                          value={editData?.productCategoryNames?.[cat] || ''}
                          onChange={e => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              return {
                                ...d,
                                productCategoryNames: {
                                  ...d.productCategoryNames,
                                  [cat]: e.target.value,
                                },
                              };
                            });
                          }}
                          placeholder="เช่น สี, ขนาด"
                          aria-label="ชื่อหมวดสินค้า"
                          disabled={used}
                          title={used ? 'หมวดนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้' : ''}
                        />
                        {used && (
                          <div className="text-xs text-red-500 mt-1">หมวดนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <label htmlFor={`cat-short-${cat}`} className="sr-only">รหัสหมวด</label>
                        <input
                          id={`cat-short-${cat}`}
                          className="rounded border border-gray-300 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition disabled:bg-gray-100 disabled:dark:bg-neutral-800 disabled:text-gray-400"
                          value={editData?.productCategoryShorts?.[cat] || ''}
                          onChange={e => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              return {
                                ...d,
                                productCategoryShorts: {
                                  ...d.productCategoryShorts,
                                  [cat]: e.target.value,
                                },
                              };
                            });
                          }}
                          placeholder="รหัส"
                          aria-label="รหัสหมวดสินค้า"
                          disabled={used}
                          title={used ? 'หมวดนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้' : ''}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <label htmlFor={`cat-opts-${cat}`} className="sr-only">ตัวเลือกในหมวด</label>
                        <input
                          id={`cat-opts-${cat}`}
                          className="rounded border border-gray-300 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition disabled:bg-gray-100 disabled:dark:bg-neutral-800 disabled:text-gray-400"
                          value={opts.join(', ')}
                          onChange={e => {
                            if (used) return;
                            const newOpts = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              return {
                                ...d,
                                productOptions: {
                                  ...d.productOptions,
                                  [cat]: newOpts,
                                },
                              };
                            });
                          }}
                          placeholder="เช่น แดง, น้ำเงิน, เขียว"
                          aria-label="ตัวเลือกในหมวด"
                          disabled={used}
                          title={used ? 'หมวดนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถแก้ไขได้' : ''}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className={`text-xs ${used ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:underline'}`}
                          onClick={() => {
                            if (used) return;
                            setEditData((d: CompanyProfileData | null) => {
                              if (!d) return d;
                              const newOptions = { ...d.productOptions };
                              const newNames = { ...d.productCategoryNames };
                              const newShorts = { ...d.productCategoryShorts };
                              delete newOptions[cat];
                              delete newNames[cat];
                              if (newShorts) delete newShorts[cat];
                              return {
                                ...d,
                                productOptions: newOptions,
                                productCategoryNames: newNames,
                                productCategoryShorts: newShorts,
                              };
                            });
                          }}
                          aria-label={`ลบหมวดสินค้า ${editData?.productCategoryNames?.[cat] || cat}`}
                          disabled={used}
                          title={used ? 'หมวดนี้ถูกใช้งานในเอกสารแล้ว ไม่สามารถลบได้' : ''}
                        >ลบ</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Add new product category */}
          <div className="flex flex-col gap-1 mt-2 border-t pt-3">
            <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">เพิ่มหมวดสินค้าใหม่</label>
            <div className="flex gap-2 items-end">
              <input
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="ชื่อหมวด เช่น สี, ขนาด"
                aria-label="ชื่อหมวดสินค้าใหม่"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
              <input
                className="rounded border border-gray-300 px-2 py-1 text-sm w-20 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="รหัส"
                aria-label="รหัสหมวดสินค้าใหม่"
                value={newCatShort}
                onChange={e => setNewCatShort(e.target.value)}
              />
              <input
                className="rounded border border-gray-300 px-2 py-1 text-sm flex-1 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition"
                placeholder="ตัวเลือกสินค้า คั่นด้วย ,"
                aria-label="ตัวเลือกสินค้าใหม่"
                value={newCatOpts}
                onChange={e => setNewCatOpts(e.target.value)}
              />
              <button
                type="button"
                className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                onClick={() => {
                  if (!editData) return;
                  const catKey = newCatName.trim();
                  const optsArr = newCatOpts.split(',').map((s: string) => s.trim()).filter(Boolean);
                  const short = newCatShort.trim();
                  if (!catKey || optsArr.length === 0) return;
                  setEditData((d: CompanyProfileData | null) => {
                    if (!d) return d;
                    return {
                      ...d,
                      productOptions: {
                        ...d.productOptions,
                        [catKey]: optsArr,
                      },
                      productCategoryNames: {
                        ...d.productCategoryNames,
                        [catKey]: catKey,
                      },
                      productCategoryShorts: {
                        ...d.productCategoryShorts,
                        [catKey]: short,
                      },
                    };
                  });
                  setNewCatName('');
                  setNewCatOpts('');
                  setNewCatShort('');
                }}
              >เพิ่มหมวด</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              type="submit"
              className="px-2 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              บันทึก
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              onClick={() => setEditingProduct(false)}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanyProductOptions;
