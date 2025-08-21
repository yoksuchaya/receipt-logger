"use client";

import Image from "next/image";
import ReceiptLogger from "@/components/receipt/ReceiptLogger";
import ReceiptLogList from "@/components/receipt/ReceiptLogList";
import VatReport from "@/components/vat/VatReport";
import AccountBook from "@/components/account/AccountBook";
import StockMovementReport from "@/components/stock/StockMovementReport";
import JournalReport from "@/components/journal/JournalReport";
import LedgerReportContainer from "@/components/journal/LedgerReportContainer";
import { useState } from "react";
import HamburgerButton from "@/components/layout/HamburgerButton";
import SidebarMenu from "@/components/layout/SidebarMenu";
import MenuOverlay from "@/components/layout/MenuOverlay";
import MobileCloseButton from "@/components/layout/MobileCloseButton";


type MenuKey =
  | 'upload-receipt'
  | 'receipt-list'
  | 'stock-overview'
  | 'stock-movement'
  | 'journal'
  | 'ledger'
  | 'vat-purchase'
  | 'vat-sales';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('upload-receipt');
  // Add a reset counter to forcefully reset stateful components on menu change
  const [resetList, setResetList] = useState(0);

  function handleSelectMenu(menu: MenuKey) {
    setSelectedMenu(menu);
    setMenuOpen(false);
    setResetList((c) => c + 1);
  }

  return (
    <div className="font-sans min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Page Skeleton: Hamburger, Sidebar, Overlay, Main Content */}

  {!menuOpen && <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />}
  {menuOpen && <MobileCloseButton onClick={() => setMenuOpen(false)} />}
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
              {selectedMenu === 'upload-receipt' && 'อัพโหลดใบเสร็จ'}
              {selectedMenu === 'receipt-list' && 'รายการใบเสร็จ'}
              {selectedMenu === 'stock-overview' && 'ภาพรวมสต็อก'}
              {selectedMenu === 'stock-movement' && 'ความเคลื่อนไหวสต็อก'}
              {selectedMenu === 'journal' && 'สมุดรายวันทั่วไป'}
              {selectedMenu === 'ledger' && 'สมุดบัญชีแยกประเภท'}
              {selectedMenu === 'vat-purchase' && 'รายงานภาษีซื้อ'}
              {selectedMenu === 'vat-sales' && 'รายงานภาษีขาย'}
            </h2>
          </div>
          <div className="flex-1 w-full flex flex-col items-center justify-start px-4 pb-8 overflow-auto">
            {selectedMenu === 'upload-receipt' && <ReceiptLogger />}
            {selectedMenu === 'receipt-list' && <ReceiptLogList key={resetList} />}
            {selectedMenu === 'stock-overview' && (
              <div className="w-full text-center text-gray-500 dark:text-gray-300 py-8">
                <p>ยังไม่มีข้อมูลภาพรวมสต็อก</p>
              </div>
            )}
            {selectedMenu === 'stock-movement' && <StockMovementReport />}
            {selectedMenu === 'journal' && <JournalReport key={resetList} onBack={() => {}} />}
            {selectedMenu === 'ledger' && <LedgerReportContainer key={resetList} onBack={() => {}} />}
            {selectedMenu === 'vat-purchase' && <VatReport key={resetList} />}
            {selectedMenu === 'vat-sales' && <VatReport key={resetList} />}
          </div>
        </div>
      </main>
    </div>
  );
}
