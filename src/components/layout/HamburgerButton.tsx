
import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ open, onClick }) => (
  <button
    className="sm:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow focus:outline-none"
    aria-label="Open menu"
    onClick={onClick}
  >
    <Bars3Icon className="w-7 h-7 text-gray-800 dark:text-gray-100" aria-hidden="true" />
  </button>
);

export default HamburgerButton;
