import React from "react";

interface VatBreadcrumbProps {
    type: 'purchase' | 'sale';
    onBack: () => void;
}

const typeLabel: Record<'purchase' | 'sale', string> = {
    purchase: 'รายงานภาษีซื้อ',
    sale: 'รายงานภาษีขาย',
};

const VatBreadcrumb: React.FC<VatBreadcrumbProps> = ({ type, onBack }) => (
    <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 rounded-lg px-4 py-2 shadow-sm border border-gray-100 dark:border-neutral-700">
            <li>
                <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                    onClick={onBack}
                >
                    รายงานภาษีมูลค่าเพิ่ม
                </button>
            </li>
            <li>
                <span className="w-4 h-4 text-gray-400 mx-1">&gt;</span>
            </li>
            <li className="text-gray-800 dark:text-gray-100 font-semibold">{typeLabel[type]}</li>
        </ol>
    </nav>
);

export default VatBreadcrumb;
