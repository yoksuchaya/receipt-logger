import React from "react";

interface SidebarMenuProps {
  open: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ open }) => (
  <aside
    className={`fixed sm:static z-20 top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col py-8 px-4 gap-4 shadow-sm transition-transform duration-200 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
    style={{ minWidth: '14rem', maxWidth: '16rem' }}
  >
    <h1 className="text-xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">Menu</h1>
    <nav className="flex flex-col gap-2">
      <button className="text-left px-4 py-2 rounded-lg font-medium text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
        Receipt Logging
      </button>
      {/* Future menu items can go here */}
    </nav>
  </aside>
);

export default SidebarMenu;
