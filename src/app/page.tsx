"use client";

import Image from "next/image";
import ReceiptLogger from "@/components/ReceiptLogger";
import { useState } from "react";
import HamburgerButton from "@/components/HamburgerButton";
import SidebarMenu from "@/components/SidebarMenu";
import MenuOverlay from "@/components/MenuOverlay";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="font-sans min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Page Skeleton: Hamburger, Sidebar, Overlay, Main Content */}
      <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
      <SidebarMenu open={menuOpen} />
      <MenuOverlay show={menuOpen} onClick={() => setMenuOpen(false)} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <Image
            className="dark:invert mb-6"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">Receipt Logging</h2>
          <ReceiptLogger />
        </div>
      </main>
    </div>
  );
}
