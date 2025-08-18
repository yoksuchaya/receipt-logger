import React from "react";

interface VatBreadcrumbProps {
    type: 'purchase' | 'sale';
    onBack: () => void;
    onRoot?: () => void;
    edit?: boolean;
}

const typeLabel: Record<'purchase' | 'sale', string> = {
    purchase: 'รายงานภาษีซื้อ',
    sale: 'รายงานภาษีขาย',
};

const VatBreadcrumb: React.FC<VatBreadcrumbProps> = ({ type, onBack, onRoot, edit }) => (
    <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 rounded-lg px-4 py-2 shadow-sm border border-gray-100 dark:border-neutral-700">
            <li>
                <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                    onClick={onRoot}
                >
                    รายงานภาษีมูลค่าเพิ่ม
                </button>
            </li>
            <li>
                {(typeof edit === 'boolean') ? (
                    <button
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                        onClick={onBack}
                    >
                        <span className="w-4 h-4 text-gray-400 mx-1">&gt;</span>
                        {typeLabel[type]}
                    </button>
                ) : (
                    <span className="flex items-center gap-1 text-gray-800 dark:text-gray-100 font-semibold">
                        <span className="w-4 h-4 text-gray-400 mx-1">&gt;</span>
                        {typeLabel[type]}
                    </span>
                )}
            </li>
            {(typeof edit === 'boolean') && (
                <>
                    <li>
                        <span className="w-4 h-4 text-gray-400 mx-1">&gt;</span>
                    </li>
                    <li className="text-gray-800 dark:text-gray-100 font-semibold">{edit ? 'แก้ไขข้อมูล' : 'ดูข้อมูล'}</li>
                </>
            )}
        </ol>
    </nav>
);

export default VatBreadcrumb;
