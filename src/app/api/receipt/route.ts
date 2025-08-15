import { NextRequest, NextResponse } from "next/server";

// You should store these in environment variables
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// Simple in-memory cache for base64 image to result
const ocrCache = new Map<string, any>();

export async function POST(req: NextRequest) {
  // Accept multipart/form-data or base64 JSON
  const contentType = req.headers.get("content-type") || "";
  let base64: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    base64 = Buffer.from(arrayBuffer).toString("base64");
  } else {
    // Accept JSON: { base64: "..." }
    const body = await req.json();
    base64 = body.base64;
  }

  if (!base64) return NextResponse.json({ error: "No image data" }, { status: 400 });

  // Check cache first
  if (ocrCache.has(base64)) {
    return NextResponse.json(ocrCache.get(base64));
  }

  // 1. Call Mistral OCR
  const mistralRes = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        image_url: `data:image/png;base64,${base64}`
      }
    })
  });
  if (!mistralRes.ok) {
    return NextResponse.json({ error: "Mistral OCR failed" }, { status: 500 });
  }
  const mistralData = await mistralRes.json();
  const markdown = mistralData.pages?.[0]?.markdown;
  if (!markdown) return NextResponse.json({ error: "No markdown from OCR" }, { status: 500 });

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

- For any required field that cannot be found, return an empty string.
- For the 'notes' field, provide a summary of the products in Thai language.
- If the date is in the Thai Buddhist Era (พ.ศ.), convert it to the Gregorian calendar (ค.ศ., AD). For example, พ.ศ. 2566 = ค.ศ. 2023. Always return the date in YYYY-MM-DD format in AD.

- For the 'receipt_no' field, do your best to extract the receipt or invoice number from the receipt image. Look for numbers or codes near common keywords such as "เลขที่", "No.", "Receipt No.", "ใบเสร็จ", "INVOICE", "BILL", "เลขที่ใบกำกับภาษี", "Tax Invoice No.", or similar, in both Thai and English. If multiple candidates are found, choose the one closest to these keywords or most likely to be the official receipt number. If you cannot find a clearly labeled receipt number, extract any unique number string that could plausibly be the receipt or invoice number. Do not return a completely empty string unless there is truly no candidate.`
        },
        {
          role: "user",
          content: JSON.stringify(markdown)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_extractor",
          schema: {
            properties: {
              date: { description: "Date of the receipt image", type: "string", format: "date" },
              grand_total: { description: "Grand total of the receipt image", type: "number" },
              vat: { description: "Vat of the receipt image", type: "number" },
              vendor: { description: "Vendor or shop name from the receipt", type: "string" },
              vendor_tax_id: { description: "Tax payer ID of the vendor/shop from the receipt image", type: "string" },
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
              payment: {
                type: "object",
                properties: {
                  cash: { title: "เงินสด", type: "number" },
                  transfer: { title: "เงินโอน", type: "number" }
                },
                required: ["cash", "transfer"],
                additionalProperties: false
              },
              notes: { description: "A short description for ledger (in Thai)", type: "string" },
              receipt_no: { description: "Receipt or invoice number from the receipt image", type: "string" }
            },
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
        }
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
  let result;
  try {
    result = JSON.parse(openRouterData.choices[0].message.content);
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON from OpenRouter" }, { status: 500 });
  }
  // Store in cache
  ocrCache.set(base64, result);
  return NextResponse.json(result);
}
