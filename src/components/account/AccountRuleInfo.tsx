import React from "react";

interface AccountRuleInfoProps {
  accountNumber: string;
  rules: any;
  journalTypeLabels: Record<string, string>;
}

const AccountRuleInfo: React.FC<AccountRuleInfoProps> = ({ accountNumber, rules, journalTypeLabels }) => {
  if (!rules) return <div className="text-xs text-gray-400">ไม่พบข้อมูลกฎสำหรับบัญชีนี้</div>;

  // Find all rules that reference this account number, but always show both sides for context
  const sections = Object.keys(journalTypeLabels || {});
  const usedIn: { section: string; idx: number; rule: any }[] = [];
  sections.forEach((section) => {
    if (Array.isArray(rules[section])) {
      rules[section].forEach((rule: any, idx: number) => {
        if (
          (rule.debit && rule.debit.split("|").includes(accountNumber)) ||
          (rule.credit && rule.credit.split("|").includes(accountNumber))
        ) {
          usedIn.push({ section, idx, rule });
        }
      });
    }
  });

  if (usedIn.length === 0) {
    return <div className="text-xs text-gray-400">บัญชีนี้ยังไม่ได้ถูกใช้ในกฎการบันทึกบัญชี</div>;
  }

  // Section names from prop
  const sectionNames = journalTypeLabels || {};

  // Helper to show all accounts, highlighting the current one
  const showAccounts = (side: string | undefined, accountNumber: string) => {
    if (!side) return <span className="text-gray-400">–</span>;
    const accounts = side.split("|");
    return accounts.map((acc, i) => (
      <span key={acc} className={acc === accountNumber ? "font-bold text-blue-600 dark:text-blue-300" : ""}>
        {acc}{i < accounts.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  return (
    <div className="text-xs text-gray-700 dark:text-gray-200">
      <div className="font-semibold mb-2">บัญชีนี้ถูกใช้ในกฎต่อไปนี้:</div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-2 py-1 border">ประเภท</th>
              <th className="px-2 py-1 border">เดบิต (บัญชีที่รับเงิน)</th>
              <th className="px-2 py-1 border">เครดิต (บัญชีที่จ่ายเงิน)</th>
              <th className="px-2 py-1 border">เงื่อนไข (ถ้ามี)</th>
            </tr>
          </thead>
          <tbody>
            {usedIn.map(({ section, idx, rule }) => (
              <tr key={`${section}-${idx}`} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-900">
                <td className="px-2 py-1 border font-medium">{sectionNames[section] || section}</td>
                <td className="px-2 py-1 border">{showAccounts(rule.debit, accountNumber)}</td>
                <td className="px-2 py-1 border">{showAccounts(rule.credit, accountNumber)}</td>
                <td className="px-2 py-1 border text-gray-500">{rule.condition ? rule.condition : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-gray-500">
        <span className="font-bold text-blue-600 dark:text-blue-300">หมายเหตุ:</span> บัญชีที่เป็น <span className="font-bold text-blue-600 dark:text-blue-300">สีน้ำเงิน</span> คือบัญชีนี้
        <br />
        <span>เดบิต = เงินเข้าบัญชีนี้, เครดิต = เงินออกจากบัญชีนี้ (อธิบายอย่างง่าย)</span>
      </div>
    </div>
  );
};

export default AccountRuleInfo;
