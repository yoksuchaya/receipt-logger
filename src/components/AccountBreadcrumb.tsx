
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface AccountBreadcrumbProps {
  onBack?: () => void;
  onRoot?: () => void;
  current?: string;
}

const AccountBreadcrumb: React.FC<AccountBreadcrumbProps> = ({ onBack, onRoot, current }) => (
  <nav className="text-sm mb-6">
    <ol className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800 rounded-lg px-4 py-2 shadow-sm border border-gray-100 dark:border-neutral-700">
      <li>
        <button
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
          onClick={onRoot}
          type="button"
        >
          สมุดบัญชี
        </button>
      </li>
      {current && (
        <>
          <li>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
          </li>
          <li>
            <span className="text-gray-800 dark:text-gray-100 font-semibold">{current}</span>
          </li>
        </>
      )}
    </ol>
  </nav>
);

export default AccountBreadcrumb;
