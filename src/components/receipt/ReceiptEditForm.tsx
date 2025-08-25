// Shared type for edit form data
export type ReceiptEditFormData = {
  image_path?: string;
  fileUrl?: string;
  image_type?: string;
  fileType?: string;
  image_name?: string;
  fileName?: string;
  receipt_no?: string;
  date?: string;
  category?: string;
  vendor?: string;
  vendor_tax_id?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_tax_id?: string;
  grand_total?: number | string;
  vat?: number | string;
  payment_type?: string;
  notes?: string;
  products?: Array<any>;
  systemGenerated?: boolean;
};

import React from "react";
import ReceiptLogger from "./ReceiptLogger";
import IssueReceiptForm from "../document/IssueReceiptForm";

interface ReceiptEditFormProps {
  systemGenerated: boolean;
  initialValues?: any;
  onSubmit?: (form: any) => void;
  onCancel?: () => void;
}

const ReceiptEditForm: React.FC<ReceiptEditFormProps> = ({ systemGenerated, initialValues, onSubmit, onCancel }) => {
  const mode = 'edit';
  if (systemGenerated) {
    return <IssueReceiptForm initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
  }
  return <ReceiptLogger initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
};

export default ReceiptEditForm;
