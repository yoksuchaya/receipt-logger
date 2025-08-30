import React, { useState } from "react";
import Tooltip from "./Tooltip";
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ListBulletIcon,
  CubeIcon,
  ChartBarIcon,
  BookOpenIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  BanknotesIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";


interface SidebarMenuProps {
  open: boolean;
  onSelectMenu?: (menu: string) => void;
  selectedMenu?: string;
}


const menuGroups = [
  {
    key: 'financial-docs',
    label: 'เอกสาร',
    icon: DocumentTextIcon,
    items: [
      {
        key: 'upload-receipt',
        label: 'อัพโหลดใบเสร็จ (Upload Receipt)',
        icon: ArrowUpTrayIcon,
      },
      {
        key: 'financial-doc-list',
        label: 'รายการเอกสาร',
        icon: ListBulletIcon,
      },
      {
        key: 'issue-document',
        label: 'ออกเอกสาร',
        icon: DocumentTextIcon,
      },
    ],
  },
  {
    key: 'stock',
    label: 'สต็อก (Stock)',
    icon: CubeIcon,
    items: [
      {
        key: 'stock-overview',
        label: 'ภาพรวมสต็อก (Stock Overview)',
        icon: Squares2X2Icon,
      },
      {
        key: 'stock-movement',
        label: 'ความเคลื่อนไหวสต็อก (Stock Movement)',
        icon: ArrowPathIcon,
      },
    ],
  },
  {
    key: 'account',
    label: 'สมุดบัญชี',
    icon: BookOpenIcon,
    items: [
      {
        key: 'journal',
        label: 'สมุดรายวันทั่วไป (Journal)',
        icon: BookOpenIcon,
      },
      {
        key: 'ledger',
        label: 'สมุดบัญชีแยกประเภท (Ledger)',
        icon: BanknotesIcon,
      },
    ],
  },
  {
    key: 'reports',
    label: 'รายงาน (Reports)',
    icon: ChartBarIcon,
    items: [
      // {
      //   key: 'vat-purchase',
      //   label: 'รายงานภาษีซื้อ (VAT Purchase Report)',
      //   icon: ArrowTrendingDownIcon, // Purchase = expense
      // },
      // {
      //   key: 'vat-sales',
      //   label: 'รายงานภาษีขาย (VAT Sales Report)',
      //   icon: ArrowTrendingUpIcon, // Sales = income
      // },
      {
        key: 'vat-summary',
        label: 'สรุปภาษีมูลค่าเพิ่มประจำเดือน',
        icon: ClipboardDocumentCheckIcon, // Summary/report
      },
      {
        key: 'trial-balance',
        label: 'งบทดลอง (ประจำเดือน)',
        icon: CalculatorIcon, // Calculation/balance
      },
    ],
  },
  {
    key: 'company',
    label: 'ข้อมูลบริษัท',
    icon: BuildingOffice2Icon,
    items: [
      {
        key: 'company-profile',
        label: 'ตั้งค่าข้อมูลบริษัท',
        icon: Cog6ToothIcon,
      },
      {
        key: 'account-chart',
        label: 'ผังบัญชี',
        icon: ListBulletIcon,
      },
    ],
  },
];


const SidebarMenu: React.FC<SidebarMenuProps> = ({ open, onSelectMenu, selectedMenu }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set([menuGroups[0]?.key]));

  const handleSectionToggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <aside
      className={`fixed sm:static z-20 top-0 left-0 h-full bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col py-8 px-2 gap-4 shadow-sm transition-all duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
        ${collapsed ? 'sm:w-16 w-64' : 'sm:w-64 w-64'}
        flex-1 overflow-y-auto`
      }
      style={{ minWidth: collapsed ? '4rem' : '14rem', maxWidth: collapsed ? '4rem' : '16rem' }}
    >
      <div className="flex items-center justify-between mb-6">
        {!collapsed && <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">เมนู</h1>}
        <button
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300"
          title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          )}
        </button>
      </div>
      <nav className="flex flex-col gap-3">
        {menuGroups.map((group) => (
          <div key={group.key} className="flex flex-col items-center sm:items-stretch pb-1">
            {collapsed ? (
              <Tooltip content={group.label}>
                <button
                  type="button"
                  aria-expanded={openSections.has(group.key)}
                  aria-controls={`section-${group.key}`}
                  className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg font-bold text-xs uppercase tracking-wide focus:outline-none transition
                    bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-neutral-700
                    justify-center sm:justify-start`}
                  onClick={() => handleSectionToggle(group.key)}
                  tabIndex={0}
                  aria-label={group.label}
                >
                  <span className="w-5 h-5 flex items-center justify-center"><group.icon className="w-5 h-5" aria-hidden="true" /></span>
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                aria-expanded={openSections.has(group.key)}
                aria-controls={`section-${group.key}`}
                className={`flex items-center w-full gap-2 px-2 py-2 rounded-lg font-bold text-xs uppercase tracking-wide focus:outline-none transition
                  bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-neutral-700
                  justify-center sm:justify-start`}
                onClick={() => handleSectionToggle(group.key)}
                tabIndex={0}
              >
                <span className="w-5 h-5 flex items-center justify-center"><group.icon className="w-5 h-5" aria-hidden="true" /></span>
                <span>{group.label}</span>
                <span className="ml-auto">
                  <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${openSections.has(group.key) ? 'rotate-90' : ''}`} aria-hidden="true" />
                </span>
              </button>
            )}
            <div
              id={`section-${group.key}`}
              className={`flex flex-col gap-2 mt-2 pl-2 border-l border-gray-100 dark:border-neutral-800 transition-all duration-200 w-full
                ${collapsed ? 'items-center' : ''}
                ${openSections.has(group.key) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
              aria-hidden={!openSections.has(group.key)}
            >
              {group.items.map((item) => (
                collapsed ? (
                  <Tooltip key={item.key} content={item.label}>
                    <button
                      className={`flex items-center gap-2 text-left px-1.5 py-1.5 rounded-md font-normal text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full
                        ${selectedMenu === item.key ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' : 'text-gray-800 dark:text-gray-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800'}
                        justify-start`}
                      onClick={() => onSelectMenu && onSelectMenu(item.key)}
                      aria-label={item.label}
                    >
                      <span className="w-4 h-4 flex items-center justify-center"><item.icon className="w-4 h-4" aria-hidden="true" /></span>
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    key={item.key}
                    className={`flex items-center gap-2 text-left px-1.5 py-1.5 rounded-md font-normal text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full
                      ${selectedMenu === item.key ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' : 'text-gray-800 dark:text-gray-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                    onClick={() => onSelectMenu && onSelectMenu(item.key)}
                  >
                    <span className="w-4 h-4 flex items-center justify-center"><item.icon className="w-4 h-4" aria-hidden="true" /></span>
                    <span>{item.label}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarMenu;
