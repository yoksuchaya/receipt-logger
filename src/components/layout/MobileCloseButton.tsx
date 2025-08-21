import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface MobileCloseButtonProps {
  onClick: () => void;
}

const MobileCloseButton: React.FC<MobileCloseButtonProps> = ({ onClick }) => (
  <button
    className="sm:hidden fixed top-4 right-4 z-40 p-2 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow focus:outline-none"
    aria-label="Close menu"
    onClick={onClick}
  >
    <XMarkIcon className="w-7 h-7 text-gray-800 dark:text-gray-100" aria-hidden="true" />
  </button>
);

export default MobileCloseButton;
