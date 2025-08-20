import React, { useState } from "react";


interface SidebarMenuProps {
  open: boolean;
  onSelectMenu?: (menu: string) => void;
  selectedMenu?: string;
}


const menuItems = [
  {
    key: 'log',
    label: 'อัพโหลดใบเสร็จ',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
    ),
  },
  {
    key: 'receipts',
    label: 'รายการใบเสร็จที่อัพโหลด',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8M8 14h8"/></svg>
    ),
  },
  {
    key: 'vat-report',
    label: 'รายงานภาษีมูลค่าเพิ่ม',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm3 3v12h12V6H6zm3 3h6v6H9V9z"/></svg>
    ),
  },
  {
    key: 'account-book',
    label: 'สมุดบัญชี',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/></svg>
    ),
  },
  {
    key: 'stock-movement',
    label: 'ความเคลื่อนไหวสต๊อก',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-4M12 16v-8M17 16v-2"/></svg>
    ),
  },
];

const SidebarMenu: React.FC<SidebarMenuProps> = ({ open, onSelectMenu, selectedMenu }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed sm:static z-20 top-0 left-0 h-full bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col py-8 px-2 gap-4 shadow-sm transition-all duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
        ${collapsed ? 'sm:w-16 w-64' : 'sm:w-64 w-64'}
      `}
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
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
          )}
        </button>
      </div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`flex items-center gap-3 text-left px-2 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition
              ${selectedMenu === item.key ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' : 'text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700'}
              ${collapsed ? 'justify-center px-0' : ''}`}
            onClick={() => onSelectMenu && onSelectMenu(item.key)}
            title={item.label}
          >
            <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarMenu;
