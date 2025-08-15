import React from "react";

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ open, onClick }) => (
  <button
    className="sm:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label={open ? "Close menu" : "Open menu"}
    onClick={onClick}
  >
    <span
      className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 mb-1 rounded transition-all"
      style={{ transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }}
    />
    <span
      className={`block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 mb-1 rounded transition-all ${open ? 'opacity-0' : ''}`}
    />
    <span
      className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-100 rounded transition-all"
      style={{ transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }}
    />
  </button>
);

export default HamburgerButton;
