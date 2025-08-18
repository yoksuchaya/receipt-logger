"use client";

import Image from "next/image";
import ReceiptLogger from "@/components/ReceiptLogger";
import ReceiptLogList from "@/components/ReceiptLogList";
import VatReport from "@/components/VatReport";
import AccountBook from "@/components/AccountBook";
import { useState } from "react";
import HamburgerButton from "@/components/HamburgerButton";
import SidebarMenu from "@/components/SidebarMenu";
import MenuOverlay from "@/components/MenuOverlay";


type MenuKey = 'log' | 'receipts' | 'vat-report' | 'account-book';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('log');
  // Add a reset counter to forcefully reset ReceiptLogList state on menu change
  const [resetList, setResetList] = useState(0);

  function handleSelectMenu(menu: MenuKey) {
    setSelectedMenu(menu);
    setMenuOpen(false);
    setResetList((c) => c + 1);
  }

  return (
    <div className="font-sans min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Page Skeleton: Hamburger, Sidebar, Overlay, Main Content */}
      <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
  <SidebarMenu open={menuOpen} onSelectMenu={(menu) => handleSelectMenu(menu as MenuKey)} selectedMenu={selectedMenu} />
      <MenuOverlay show={menuOpen} onClick={() => setMenuOpen(false)} />

      {/* Main content area - fill all available space, keep logo at top */}
      <main className="flex-1 flex flex-col h-screen min-h-0 p-0 max-w-full overflow-x-hidden">
        <div className="flex flex-col h-full w-full max-w-full bg-white dark:bg-neutral-900 rounded-none shadow-none p-0">
          <div className="flex flex-col items-center pt-8 pb-2 px-4">
            <Image
              className="dark:invert mb-6"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
            />
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
              {selectedMenu === 'log' && 'อัพโหลดใบเสร็จ'}
              {selectedMenu === 'receipts' && 'รายการใบเสร็จที่อัพโหลด'}
              {selectedMenu === 'vat-report' && 'รายงานภาษีมูลค่าเพิ่ม'}
              {selectedMenu === 'account-book' && 'สมุดบัญชี'}
            </h2>
          </div>
          <div className="flex-1 w-full flex flex-col items-center justify-start px-4 pb-8 overflow-auto">
            {selectedMenu === 'log' && <ReceiptLogger />}
            {selectedMenu === 'receipts' && <ReceiptLogList key={resetList} />}
            {selectedMenu === 'vat-report' && <VatReport key={resetList} />}
            {selectedMenu === 'account-book' && <AccountBook key={resetList} />}
          </div>
        </div>
      </main>
    </div>
  );
}
