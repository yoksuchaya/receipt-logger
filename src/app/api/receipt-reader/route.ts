import { NextRequest, NextResponse } from "next/server";

// You should store these in environment variables
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// Simple in-memory cache for base64 image to result
const ocrCache = new Map<string, unknown>();

export async function POST(req: NextRequest) {
  // Fetch payment types from API before calling OpenRouter
  let paymentTypeProps: Record<string, any> = {};
  let paymentTypeRequired: string[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const companyProfileRes = await fetch(`${baseUrl}/api/company-profile`);
    if (companyProfileRes.ok) {
      const companyProfile = await companyProfileRes.json();
      if (Array.isArray(companyProfile.paymentTypes)) {
        paymentTypeProps = companyProfile.paymentTypes.reduce((acc: Record<string, any>, cur: any) => {
          acc[cur.value] = { title: cur.label, type: "number" };
          return acc;
        }, {});
        paymentTypeRequired = companyProfile.paymentTypes.map((cur: any) => cur.value);
      }
    }
  } catch (e) {
    // fallback to default
    paymentTypeProps = { cash: { title: "เงินสด", type: "number" } };
    paymentTypeRequired = ["cash"];
  }
  // Accept multipart/form-data or base64 JSON
  const contentType = req.headers.get("content-type") || "";
  let base64: string | null = null;
  let isPdf = false;
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    base64 = Buffer.from(arrayBuffer).toString("base64");
    isPdf = file.type === "application/pdf";
  } else {
    // Accept JSON: { base64: "...", fileType?: string }
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    base64 = body.base64;
    if (body.fileType && body.fileType === "application/pdf") {
      isPdf = true;
    }
  }

  if (!base64) return NextResponse.json({ error: "No image data" }, { status: 400 });

  // Check cache first
  if (ocrCache.has(base64)) {
    return NextResponse.json(ocrCache.get(base64));
  }

  const mistralPayload = {
    model: "mistral-ocr-latest",
    document: isPdf
      ? {
        type: "document_url",
        document_url: `data:application/pdf;base64,${base64}`
      }
      : {
        type: "image_url",
        image_url: `data:image/png;base64,${base64}`
      },
    include_image_base64: true
  };
  const mistralRes = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mistralPayload)
  });
  if (!mistralRes.ok) {
    const errorText = await mistralRes.text();
    return NextResponse.json({ error: "Mistral OCR failed", details: errorText }, { status: 500 });
  }
  let mistralData: unknown;
  try {
    mistralData = await mistralRes.json();
    // console.log('Mistral OCR response:', JSON.stringify(mistralData, null, 2));
  } catch {
    return NextResponse.json({ error: "Mistral OCR did not return valid JSON" }, { status: 500 });
  }
  // Type guard for mistralData
  const markdown = (typeof mistralData === 'object' && mistralData !== null && 'pages' in mistralData && Array.isArray((mistralData as { pages: unknown[] }).pages))
    ? ((mistralData as { pages: Array<{ markdown?: string }> }).pages?.[0]?.markdown)
    : undefined;
  if (!markdown) return NextResponse.json({ error: "No markdown from OCR" }, { status: 500 });

  // Build schema object with paymentTypeProps and paymentTypeRequired (after they are defined)
  const invoiceSchema = {
    name: "invoice_extractor",
    schema: {
      properties: Object.assign({
        date: { description: "Date of the receipt image", type: "string", format: "date" },
        grand_total: { description: "Grand total of the receipt image", type: "number" },
        vat: { description: "Vat of the receipt image", type: "number" },
        vendor: { description: "Vendor or shop name or seller from the receipt", type: "string" },
        vendor_tax_id: { description: "Tax payer ID of the vendor/shop or seller from the receipt image", type: "string" },
        buyer_name: { description: "Name of the buyer from the receipt image", type: "string" },
        buyer_address: { description: "Address of the buyer from the receipt image", type: "string" },
        buyer_tax_id: { description: "Tax payer ID of the buyer from the receipt image", type: "string" },
        category: { description: "Category of the purchase or expense", type: "string" },
        products: {
          description: "List of products in the receipt image",
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { description: "Name of the product", type: "string" },
              weight: { description: "Weight of the product", type: "number" },
              quantity: { description: "Quantity of the product", type: "number" },
              pricePerItem: { description: "Price of the product per item", type: "number" },
              price: { description: "Total price of the product", type: "number" }
            },
            required: ["name", "weight", "quantity", "pricePerItem", "price"],
            additionalProperties: false
          },
          additionalProperties: false
        },
        notes: { description: "A short description for ledger (in Thai)", type: "string" },
        receipt_no: { description: "Receipt or invoice number from the receipt image", type: "string" }
      }, {
        payment: {
          type: "object",
          description: "Object with all payment types and their amounts. Keys are dynamically loaded from company profile. If a type is not present, set its value to 0.",
          properties: paymentTypeProps,
          required: paymentTypeRequired,
          additionalProperties: false
        }
      }),
      type: "object",
      required: [
        "receipt_no",
        "date",
        "grand_total",
        "vat",
        "vendor",
        "vendor_tax_id",
        "buyer_name",
        "buyer_address",
        "buyer_tax_id",
        "category",
        "products",
        "payment",
        "notes"
      ],
      additionalProperties: false
    },
    strict: true
  };

  // Fetch company profile for prompt
  let companyProfile: any = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const companyProfileRes = await fetch(`${baseUrl}/api/company-profile`);
    if (companyProfileRes.ok) {
      companyProfile = await companyProfileRes.json();
    }
  } catch (e) {
    console.log('Error fetching company profile:', e);
  }

  // Build product categories/options string for prompt
  let productCategoryStr = '';
  let productOptionsStr = '';
  if (companyProfile) {
    productCategoryStr = Object.values(companyProfile.productCategoryNames || {}).join(', ');
    productOptionsStr = Object.entries(companyProfile.productOptions || {})
      .map(([cat, opts]) => `${companyProfile.productCategoryNames?.[cat] || cat}: ${Array.isArray(opts) ? opts.join(', ') : ''}`)
      .join(' | ');
  }

  // 2. Call OpenRouter for JSON extraction
  const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are the json information extractor. You need to extract the below information into a specified json format.
        For any required field that cannot be found, return an empty string.
        For the 'notes' field, provide a short, concise remark in Thai suitable for the remark field in a ledger. Summarize the products or purpose of the receipt in a way that is useful for accounting records.
        If the date is in the Thai Buddhist Era (พ.ศ.), convert it to the Gregorian calendar (ค.ศ., AD). For example, พ.ศ. 2566 = ค.ศ. 2023. Always return the date in YYYY-MM-DD format in AD.
        For the 'category' field, infer the most likely category of the purchase or expense based on the product names, vendor, or keywords found in the receipt. Only return a category if it matches (even partially, fuzzily, or with common OCR misspellings, such as ทองแห่ง 96.5% for ทองแท่ง 96.5%, ignoring whitespace and minor variations) one of the following: ${productCategoryStr}. If no match, return an empty string.
        For the 'products' field, only return products whose name matches (even partially, fuzzily, or with common OCR misspellings, such as ทองแห่ง 96.5% for ทองแท่ง 96.5%, ignoring whitespace and minor variations) the following options for each category: ${productOptionsStr}. If no product matches, return an empty array.
        For the 'receipt_no' field, do your best to extract the receipt or invoice number from the receipt image. Look for numbers or codes near common keywords such as "เลขที่", "No.", "Receipt No.", "ใบเสร็จ", "INVOICE", "BILL", "เลขที่ใบกำกับภาษี", "Tax Invoice No.", or similar, in both Thai and English. If multiple candidates are found, choose the one closest to these keywords or most likely to be the official receipt number. If you cannot find a clearly labeled receipt number, extract any unique number string that could plausibly be the receipt or invoice number. Do not return a completely empty string unless there is truly no candidate.
        For the 'payment' field, always include all payment types from the company profile. If a payment type is not present on the receipt, set its value to 0.
        If the receipt is a purchase receipt from "บริษัท ห้างเพชรทองมุกดา จำกัด (สำนักงานใหญ่)", always set the 'buyer_name' to "บริษัท ห้างเพชรทองมุกดา จำกัด (สำนักงานใหญ่)" and the 'vendor' to the seller's name as found in the receipt (for example, "ปริญญา ภูมิเชียน"). If the markdown is ambiguous, use these values for buyer and vendor as the default for this company.
        `
        },
        {
          role: "user",
          content: JSON.stringify(markdown)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: invoiceSchema
      }
    })
  });
  if (!openRouterRes.ok) {
    const errorText = await openRouterRes.text();
    console.error('OpenRouter API error:', errorText);
    return NextResponse.json({ error: "OpenRouter extraction failed", details: errorText }, { status: 500 });
  }
  const openRouterData = await openRouterRes.json();
  // The result is in openRouterData.choices[0].message.content (as JSON string)
  let result: any;
  try {
    result = JSON.parse(openRouterData.choices[0].message.content);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from OpenRouter" }, { status: 500 });
  }

  // Map category display name to internal key (bullion/ornament)
  if (companyProfile && result.category) {
    const catKey = Object.keys(companyProfile.productCategoryNames || {}).find(key => companyProfile.productCategoryNames[key] === result.category);
    if (catKey) {
      result.category = catKey;
    }
  }
  return NextResponse.json(result);
}
