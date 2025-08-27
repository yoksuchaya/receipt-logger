import React from "react";
import IssueSaleReceiptForm from "../document/IssueSaleReceiptForm";
import IssuePurchaseReceiptForm from "../document/IssuePurchaseReceiptForm";
import ReceiptLogger from "./ReceiptLogger";
import { JournalVoucher } from "../document/JournalVoucher";

interface ReceiptEditFormProps {
  systemGenerated: boolean;
  initialValues?: any;
  onSubmit?: (form: any) => void;
  onCancel?: () => void;
}

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


const ReceiptEditForm: React.FC<ReceiptEditFormProps> = ({ systemGenerated, initialValues, onSubmit, onCancel }) => {
  const mode = 'edit';
  if (systemGenerated) {
    const type = initialValues?.type;
    if (type === 'sale') {
      return <IssueSaleReceiptForm initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
    }
    if (type === 'purchase') {
      return <IssuePurchaseReceiptForm initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
    }
    // fallback for other systemGenerated types (e.g. journal voucher)
    return <JournalVoucher initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
  }
  // fallback for non-systemGenerated
  return <ReceiptLogger initialValues={initialValues} mode={mode} onSubmit={onSubmit} onCancel={onCancel} />;
};

export default ReceiptEditForm;
