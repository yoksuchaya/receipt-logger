# Receipt Logger

Receipt Logger is a modern, API-driven accounting app built with Next.js, TypeScript, and Tailwind CSS. It enables accountants and businesses to:

- Take photos or upload scans of receipts (image or PDF)
- Automatically extract and structure receipt data using OCR and LLMs
- Log, edit, and manage receipts with detailed metadata
- Generate accounting reports: journal, ledger, VAT, and stock movement
- View and manage account charts
- Use a mobile-friendly, accessible UI for fast data entry and review

All core features are exposed via RESTful API endpoints (see [API Endpoints](#api-endpoints) below), making it easy to integrate with other tools or automate workflows.


## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

- `src/styles` - Tailwind and global styles


- Update UI and features as needed for your workflow.

## Development Guidelines

- Use **TypeScript** for all code.
- Ensure all code passes Next.js and TypeScript linting (`npm run lint`).
- Use modern, accessible, and mobile-friendly UI with Tailwind CSS.
- Follow best practices for Next.js app structure.

## Linting

Run the following command to check for lint errors:

```bash
npm run lint
```

Fix all reported issues before submitting code.



## API Endpoints

Below is a summary of all API endpoints in this project, with descriptions for each route:

### 1. `/api/account-chart` (GET)
Returns the account chart (list of accounts) as JSON.

**Example:**
```http
GET /api/account-chart
```

---

### 2. `/api/receipt-reader` (POST)
Uploads a receipt image (photo or PDF) and extracts structured data using OCR and LLMs. Accepts `multipart/form-data` or JSON with base64 image.

**Example:**
```http
POST /api/receipt-reader
Content-Type: multipart/form-data | application/json
```

---

### 3. `/api/receipt-log` (GET, POST)
- **GET**: Returns a list of all receipts, optionally filtered by date or type (`sale` or `purchase`).
- **POST**: Uploads a new receipt log (metadata and file).

**Example:**
```http
GET /api/receipt-log?from=2025-01-01&to=2025-12-31&type=purchase
POST /api/receipt-log
```

---

### 4. `/api/receipt-log/edit` (PUT)
Edits an existing receipt log by `receipt_no`.

**Example:**
```http
PUT /api/receipt-log/edit
Body: { receipt_no: string, ...fieldsToUpdate }
```

---

### 5. `/api/receipt-log/delete` (DELETE)
Deletes a receipt log by `receipt_no`.

**Example:**
```http
DELETE /api/receipt-log/delete
Body: { receipt_no: string }
```

---

### 6. `/api/journal-report` (GET)
Returns all journal entries for a given month and year, generated from receipts and account chart.

**Example:**
```http
GET /api/journal-report?month=08&year=2025
```

---

### 7. `/api/ledger-report` (GET)
Returns ledger entries for each account, including opening balance and running balances, for a given month. Optionally filter by `accountNumber`.

**Example:**
```http
GET /api/ledger-report?month=2025-08
GET /api/ledger-report?month=2025-08&accountNumber=1000
```

---

### 8. `/api/stock-movement` (GET)
Returns stock movement rows (inventory in/out) for a given month and year, including opening balances for each product.

**Example:**
```http
GET /api/stock-movement?month=8&year=2025
```

---

### 9. `/api/vat-purchase-report` (GET)
Returns all purchase receipts for a given month and year (for VAT reporting).

**Example:**
```http
GET /api/vat-purchase-report?month=08&year=2025
```

---

### 10. `/api/vat-sale-report` (GET)
Returns all sale receipts for a given month and year (for VAT reporting).

**Example:**
```http
GET /api/vat-sale-report?month=08&year=2025
```

---

## API Notes
- All endpoints return JSON.
- Most GET endpoints accept query parameters for filtering (e.g., by month, year, type).
- For file uploads, use `multipart/form-data`.
- For editing or deleting receipts, use the `receipt_no` as the unique identifier.

---


---


---


## Project Folder Structure

Key folders and files:

- `src/app/api/` — All API route handlers (REST endpoints)
- `src/components/` — React UI components (account, receipt, journal, layout, etc.)
- `public/uploads/` — Uploaded receipt images and files
- `account-chart.json` — Account chart (list of accounts)
- `company-profile.json` — Company profile and metadata
- `receipt-uploads.jsonl` — All receipt logs (one JSON object per line)

---

## Environment Variables

Some features require API keys (e.g., OCR/LLM). Create a `.env.local` file in the project root:

```env
# Example
MISTRAL_API_KEY=your-mistral-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

---


## Data Storage

- **Receipts:** Stored in `receipt-uploads.jsonl` (newline-delimited JSON)
- **Account Chart:** Stored in `account-chart.json`
- **Company Profile:** Stored in `company-profile.json`
- **Uploaded Files:** Saved in `public/uploads/`

Back up these files regularly to avoid data loss.

---

## Testing

Currently, there are no automated tests. To add tests, use your preferred framework (e.g., Jest, Playwright) and document test commands here.

---

## Contributing

Pull requests and issues are welcome! Please:
- Follow the coding style and linting rules
- Write clear commit messages
- Add or update documentation as needed

---

## Known Limitations & Roadmap

- No user authentication or access control yet
- Performance may degrade with very large datasets (millions of receipts)
- No automated backup or restore
- Future: add user auth, improve performance, add automated tests, support for more file types, and better error handling

---


