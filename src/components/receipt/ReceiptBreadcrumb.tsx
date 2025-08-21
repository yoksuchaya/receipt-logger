import React from "react";
import { ChevronRightIcon, PencilSquareIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

interface ReceiptBreadcrumbProps {
  edit: boolean;
  onBack: () => void;
  onEdit?: () => void;
}

const ReceiptBreadcrumb: React.FC<ReceiptBreadcrumbProps> = ({ edit, onBack, onEdit }) => (
  <nav className="text-sm mb-6">
    <ol className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 rounded-lg px-4 py-2 shadow-sm border border-gray-100 dark:border-neutral-700">
      <li>
        <button
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
          onClick={onBack}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          รายการใบเสร็จ
        </button>
      </li>
      <li>
        <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
      </li>
      {!edit ? (
        <li className="text-gray-800 dark:text-gray-100 font-semibold">ดูข้อมูล</li>
      ) : (
        <>
          <li>
            <button
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
              onClick={onEdit}
            >
              <PencilSquareIcon className="w-4 h-4 mr-1" />
              ดูข้อมูล
            </button>
          </li>
          <li>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
          </li>
          <li className="text-gray-800 dark:text-gray-100 font-semibold">แก้ไข</li>
        </>
      )}
    </ol>
  </nav>
);

export default ReceiptBreadcrumb;
