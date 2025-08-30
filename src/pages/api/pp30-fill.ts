import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { formatMoney } from '@/components/utils/utils';

const fontkit = require('@pdf-lib/fontkit');

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Get VAT summary data from query or body
    // Add companyAddress part
    const { month, year, salesVat, purchasesVat, netVat, companyName, taxId, totalSales, salesAmountExcludeVat, totalPurchases, companyAddress, phoneNo } = req.body;

    // Load the PDF template
    const pdfPath = path.join(process.cwd(), 'public', 'pp30_300160.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.registerFontkit(fontkit);
    console.log('Fontkit registered successfully');

    // List all AcroForm field names for mapping
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log('PDF Form Fields:');

    fields.forEach((field, idx) => {
        const name = field.getName();
        if (field.constructor.name === 'PDFTextField') {
            console.log(`TextField ${idx}: ${name}`);
        } else if (field.constructor.name === 'PDFRadioGroup') {
            let options = [];
            try {
                options = (field as any).getOptions ? (field as any).getOptions() : [];
            } catch {}
            console.log(`RadioGroup ${idx}: ${name} Options:`, options);
        } else {
            console.log(`Field ${idx}: ${name}`);
        }
    });

    // Embed NotoSerifThai font for Thai text
    const fontPath = path.join(process.cwd(), 'public', 'NotoSerifThai-VariableFont_wdth,wght.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    console.log('Thai font bytes length:', fontBytes.length);
    let notoSerifThai;
    try {
        notoSerifThai = await pdfDoc.embedFont(fontBytes, { subset: true });
        console.log('Font embedded successfully');
    } catch (e) {
        console.error('Error embedding Thai font:', e);
        throw e;
    }

    // Set year in Text1.Year as Buddhist year
    if (year) {
        try {
            const yearField = form.getTextField('Text1.Year');
            const buddhistYear = (parseInt(year, 10) + 543).toString();
            yearField.setText(buddhistYear);
        } catch (e) {
        }
    }

    // Check the radio button for the selected month (Nth 'Months' group)
    if (month) {
        const monthNum = parseInt(month, 10);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            // Find all radio groups named 'Months'
            const monthsRadioGroups = fields.filter(field => field.constructor.name === 'PDFRadioGroup' && field.getName() === 'Radio Button3.Months');
            console.log('Found Months radio groups:', monthsRadioGroups.length);
            if (monthsRadioGroups.length >= monthNum) {
                try {
                    const radioField = monthsRadioGroups[monthNum - 1];
                    if (radioField) {
                        console.log(`Selecting month radio button: ${monthNum - 1}`);
                        (radioField as any).select(`${monthNum - 1}`);
                    }
                } catch (e) {
                    console.log('Error selecting month radio button:', e);
                }
            } else {
            }
        }
    }

    // Select Radio Button4.BranchTypes with option '0'
    try {
        const branchTypesRadio = fields.filter(field => field.constructor.name === 'PDFRadioGroup' && field.getName() === 'Radio Button4.BranchTypes');
        (branchTypesRadio[1] as any).select('1');
    } catch (e) {
        console.warn('Could not select Radio Button4.BranchTypes:', e);
    }

    // Select Radio Button5.SeparateBranch with option '0' - สำนักงานใหญ่
    try {
        const separateBranchRadio = fields.filter(field => field.constructor.name === 'PDFRadioGroup' && field.getName() === 'Radio Button5.SeparateBranch');
        (separateBranchRadio[1] as any).select('1');
    } catch (e) {
        console.warn('Could not select Radio Button5.SeparateBranch:', e);
    }

    // Select Radio Button7.Types with option '0'
    try {
        const typesRadio = form.getRadioGroup('Radio Button7.Types');
        typesRadio.select('0');
    } catch (e) {
        console.warn('Could not select Radio Button7.Types:', e);
    }

    // Fill the tax ID into the field named 'Text1.0'
    // Format tax ID as X-XXXX-XXXXX-XX-X
    function formatThaiTaxId(id: string = ''): string {
        const digits = id.replace(/[^0-9]/g, '');
        if (digits.length !== 13) return id || '';
        return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 12)} ${digits[12]}`;
    }

    try {
        const branchId = '00001';
        const saleAmountWithoutVat = salesAmountExcludeVat ?? 0;
        const saleAmountWithVat = totalSales - saleAmountWithoutVat;
        const vatCreditBeginning = 0;
        const vatPaymentAmount = netVat - vatCreditBeginning;
        const additionalFee = 0;
        const fine = 0;
        const grandTotalVatPaymentAmount = vatPaymentAmount + additionalFee + fine;

        const taxIdField = form.getTextField('Text1.TaxId');
        const branchIdField = form.getTextField('Text1.BranchId');
        const companyNameField1 = form.getTextField('Text1.OwnerName1');
        const companyNameField2 = form.getTextField('Text1.CompanyName');
        const houseNoField = form.getTextField('Text1.HouseNo');
        const mooField = form.getTextField('Text1.MooNo');
        const soiField = form.getTextField('Text1.Soi');
        const roadField = form.getTextField('Text1.Road');
        const districtField = form.getTextField('Text1.District');
        const stateField = form.getTextField('Text1.State');
        const provinceField = form.getTextField('Text1.Province');
        const postalCodeField = form.getTextField('Text1.PostalCode');
        const phoneNoField = form.getTextField('Text1.PhoneNo');
        const salesVatField = form.getTextField('Text2.SaleVat');
        const saleAmountWithoutVatField = form.getTextField('Text2.SaleAmountWithoutVat');
        const saleAmountWithVatField = form.getTextField('Text2.SaleAmountWithVat');
        const purchasesVatField = form.getTextField('Text2.PurchaseVat');
        const netVatField = form.getTextField('Text2.VatPay');
        const vatCreditField = form.getTextField('Text2.VatCredit');
        const vatCreditBeginningField = form.getTextField('Text2.VatCreditBeginning');
        const vatPaymentAmountField = form.getTextField('Text2.PaymentAmount');
        const creditAmountField = form.getTextField('Text2.CreditAmount');
        const additionalFeeField = form.getTextField('Text2.Additional');
        const fineField = form.getTextField('Text2.Fine');
        const vatTotalField = form.getTextField('Text2.VatTotal');
        const creditTotalField = form.getTextField('Text2.CreditTotal');

        taxIdField.setText(formatThaiTaxId(taxId));
        branchIdField.setText(branchId);
        companyNameField1.setText(companyName || '');
        companyNameField2.setText(companyName || '');
        // Fill company address if provided
        if (companyAddress) {
            try {
                houseNoField.setText(companyAddress.house_number || '');
                mooField.setText(companyAddress.moo || '');
                soiField.setText(companyAddress.soi || '');
                roadField.setText(companyAddress.road || '');
                districtField.setText(companyAddress.district || '');
                stateField.setText(companyAddress.state || '');
                provinceField.setText(companyAddress.province || '');
                postalCodeField.setText(companyAddress.postal_code || '');

                houseNoField.updateAppearances(notoSerifThai);
                mooField.updateAppearances(notoSerifThai);
                soiField.updateAppearances(notoSerifThai);
                roadField.updateAppearances(notoSerifThai);
                districtField.updateAppearances(notoSerifThai);
                stateField.updateAppearances(notoSerifThai);
                provinceField.updateAppearances(notoSerifThai);
            } catch (e) {
                console.warn('Could not set company address:', e);
            }
        }
        phoneNoField.setText(phoneNo || '');
        phoneNoField.updateAppearances(notoSerifThai);
        salesVatField.setText(formatMoney(salesVat));
        saleAmountWithVatField.setText(formatMoney(saleAmountWithVat, ''));
        saleAmountWithoutVatField.setText(formatMoney(saleAmountWithoutVat));
        purchasesVatField.setText(formatMoney(purchasesVat));
        // Fill total sales and total purchases if fields exist
        try {
            const totalSalesField = form.getTextField('Text2.SaleAmount');
            totalSalesField.setText(formatMoney(totalSales ?? 0));
        } catch { }
        try {
            const totalPurchasesField = form.getTextField('Text2.PurchaseAmount');
            totalPurchasesField.setText(formatMoney(totalPurchases ?? 0));
        } catch { }
        vatCreditBeginningField.setText(formatMoney(vatCreditBeginning));
        if (netVat > 0) {
            netVatField.setText(formatMoney(netVat));
        } else {
            vatCreditField.setText(formatMoney(Math.abs(netVat)));
        }

        if (vatPaymentAmount > 0) {
            try {
                const paymentRadio = form.getRadioGroup('Payment');
                paymentRadio.select('1');
            } catch (e) {
                console.warn('Could not select Payment radio button:', e);
            }
            vatPaymentAmountField.setText(formatMoney(vatPaymentAmount));
        } else {
            try {
                const paymentRadio = form.getRadioGroup('Payment');
                paymentRadio.select('2');
            } catch (e) {
                console.warn('Could not select Payment radio button:', e);
            }
            creditAmountField.setText(formatMoney(Math.abs(vatPaymentAmount)));
        }

        additionalFeeField.setText(formatMoney(additionalFee));
        fineField.setText(formatMoney(fine));

        if (grandTotalVatPaymentAmount > 0) {
            vatTotalField.setText(formatMoney(grandTotalVatPaymentAmount));
        } else {
            creditTotalField.setText(formatMoney(Math.abs(grandTotalVatPaymentAmount)));
        }

        // Update appearance with Thai font for these fields
        (taxIdField as any).updateAppearances(notoSerifThai);
        (companyNameField1 as any).updateAppearances(notoSerifThai);
        (companyNameField2 as any).updateAppearances(notoSerifThai);

    } catch (e) {
        console.warn('Could not set Text1.0 or update appearance:', e);
    }

    const filledPdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=pp30_filled.pdf');
    res.send(Buffer.from(filledPdfBytes));
}
