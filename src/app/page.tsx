"use client";

import Image from "next/image";
import ReceiptLogger from "@/components/ReceiptLogger";
import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="font-sans min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Hamburger button for mobile */}
      <button
        className="sm:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 mb-1 rounded transition-all" style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
        <span className={`block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 mb-1 rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
        <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 rounded transition-all" style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
      </button>

      {/* Sidebar menu */}
      <aside
        className={`fixed sm:static z-20 top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col py-8 px-4 gap-4 shadow-sm transition-transform duration-200 ease-in-out
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
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

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 sm:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

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
