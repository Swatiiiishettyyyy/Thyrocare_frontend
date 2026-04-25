# Nucleotide (Frontend) ↔ Bloodtests Backend (Thyrocare + Upload) — Complete Flow (Concise)

This is the short “read once” overview of how the **existing Nucleotide frontend** talks to the **Bloodtests backend**, and how the backend integrates with **Thyrocare** plus the **external upload** feature.

- **Detailed reference**: `INTEGRATION_PLAN.md` (full end-to-end narrative)
- **Backend code present in this repo snapshot**: `Bloodtests/Upload_module/*` (Upload flow is verified from code)

## Frontend flow (React)

### Auth + API client behavior (all screens)
- **Client**: `src/api/client.ts`
- **Always** sends:
  - `credentials: 'include'` (cookie session enabled)
  - `Authorization: Bearer <token>` when present
  - `X-CSRF-Token` when present
- **401 handling**:
  - calls `POST /auth/refresh`
  - stores refreshed access token + CSRF when returned
  - retries the original request once

### Checkout + ordering flow (Tests/Packages → Cart → Address → Slot → Payment → Confirmation)
- **Catalog**
  - `src/api/products.ts`
  - `GET /thyrocare/products?page_size=...&page=...`
  - `GET /thyrocare/products/{id}`
- **Cart view / hydration**
  - `src/api/cart.ts`
  - `GET /cart/view` (cart lines; may be “one row per member”; frontend collapses per product for UI)
  - `GET /thyrocare/cart/active-all` (the server-side “group” truth used for checkout)
- **Add/update a product for checkout (new flow uses Thyrocare groups)**
  - `POST /thyrocare/cart/add` (create/extend group)
  - `PUT /thyrocare/cart/upsert` (update members/address for an existing `group_id`)
  - `DELETE /thyrocare/cart/product/{thyrocare_product_id}` (remove selection for a product)
  - “groups” are what later carry `address_id`, `member_ids`, slot, etc.
- **Address step**
  - backend endpoints are called via `src/api/address.ts` (not expanded here)
  - selected `address_id` is written into each Thyrocare group via `PUT /thyrocare/cart/upsert`
- **Slot search + set appointment**
  - `src/api/slots.ts`
  - `POST /thyrocare/slots/search` with `{ group_id, date_from, date_to, pincode?, thyrocare_product_id? }`
  - `POST /thyrocare/cart/set-appointment` with `{ group_id, appointment_date, appointment_start_time }`
- **Pricing snapshot**
  - `POST /thyrocare/cart/price-breakup` with `{ group_ids: [...], is_report_hard_copy_required: false }`
  - the frontend keeps a “pricingSnapshotKey” so totals remain consistent across navigation
- **Payment (Razorpay)**
  - `src/pages/PaymentPage.tsx`
  - `POST /orders/create` with `{ cart_id }` → returns `{ order_id, order_number, razorpay_order_id, amount }`
  - Razorpay checkout opens; on success the frontend calls:
    - `POST /orders/verify` with `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }`
  - **Important**: UI verification is not the backend “final truth”; backend confirms via Razorpay webhook.
- **Post-payment**
  - navigates to `/confirmation` with a summary payload (also stashed in `sessionStorage`)
  - **Order number source of truth**: `order_number` returned by `POST /orders/create` (saved as `orderNumber`)
    - `src/pages/PaymentPage.tsx` builds `confirmationPayload.orderNumber = orderRes.order_number`
    - `src/pages/ConfirmationPage.tsx` displays it as `#${orderNumber}` when present
    - fallback when missing: displays `#NUC-${orderId}` (a client-only label, not the API order number)

### Reports hub flow
- **List**: `src/api/orders.ts` → `fetchMyReports(memberId?)`
  - primary: `GET /thyrocare/reports/my-reports?member_id=...`
  - merges (best-effort): `GET /upload/reports/my-reports?member_id=...` (uploaded reports)
  - fallback on 404: `GET /thyrocare/orders/my-orders` (maps bookings → report rows)
- **Report detail**: `src/pages/ReportPage.tsx` (renders parameter cards from `results[]`)
- **PDF download**: `src/api/orders.ts`
  - `GET /thyrocare/reports/{patient_id}/download` (preferred)
  - `GET /thyrocare/orders/{thyrocare_order_id}/reports/{lead_id}?type=pdf` (alternate)
  - `api.getBlob(...)` fallbacks exist to handle non-JSON responses

### External upload UI flow
- **Upload page**: `src/pages/UploadReportPage.tsx`
  - user selects PDF/JPG/PNG → navigates to `/upload-report-details` with the file
- **API call**: `src/api/upload.ts` → `uploadExternalReport(file, memberId?, labName?)`
  - `POST /upload/report` as `multipart/form-data`

### Orders list + Order details flow (what the UI actually fetches)
- **Orders list screen**
  - `src/pages/OrdersPage.tsx`
  - `GET /orders/list` only (no per-row Thyrocare details; avoids N+1)
  - clicking a row routes to `/order-details` and passes `orderNumber`
- **Order details screen (first paint)**
  - `src/pages/OrderDetailsPage.tsx`
  - primary: `GET /orders/{order_number}` (when available)
  - fallback: `GET /orders/list` then finds the row by `order_number`
- **Order details screen (per-product expand = vendor timeline / patients / reports)**
  - fetches user bookings once: `GET /thyrocare/orders/my-orders` (used for current status + history when present)
  - for each Thyrocare visit id (derived from items): `GET /thyrocare/orders/{thyrocare_order_id}/order-details`
  - “View report” actions:
    - prefer `GET /thyrocare/reports/{patient_id}/download`
    - else `GET /thyrocare/orders/{thyrocare_order_id}/reports/{lead_id}?type=pdf`
  - it generates a stable report navigation key matching the Reports list (`getMyReportRowKey`) so Order Details → Report opens the same report row the list would show

### Frontend route map (quick)
- **`/`**: Tests home (catalog sections) → uses `GET /thyrocare/products...` (`src/api/products.ts`)
- **`/packages`**: Packages listing (same catalog API; filtered by category)
- **`/test/:id`**: Test detail → `GET /thyrocare/products/{id}`
- **`/cart`**: Cart + quantity edits → `GET /cart/view`, cart mutations; syncs with `GET /thyrocare/cart/active-all` (`src/api/cart.ts`)
- **`/address`**: Choose collection address → writes `address_id` into Thyrocare groups via `PUT /thyrocare/cart/upsert`
- **`/timeslot`**: Slot selection → `POST /thyrocare/slots/search`, then `POST /thyrocare/cart/set-appointment` (`src/api/slots.ts`)
- **`/payment`**: Razorpay checkout → `POST /orders/create`, `POST /orders/verify` (`src/pages/PaymentPage.tsx`)
- **`/confirmation`**: Client-only confirmation summary (state + `sessionStorage`)
- **`/orders`**: Orders list → `GET /orders/list` (`src/pages/OrdersPage.tsx`)
- **`/order-details`**: Order details/timeline/reports → `GET /orders/{order_number}`, `GET /thyrocare/orders/my-orders`, `GET /thyrocare/orders/{id}/order-details` (`src/pages/OrderDetailsPage.tsx`)
- **`/reports`**: Reports hub → `GET /thyrocare/reports/my-reports` (+ uploaded merge)
- **`/report?id=...`**: Report detail + PDF download → `/thyrocare/reports/{patient_id}/download` (or vendor PDF fallback)
- **`/upload-report`**: Upload entry page (select file)
- **`/upload-report-details`**: Upload submit page → `POST /upload/report`

## Backend flow (Bloodtests) — Thyrocare integration (per `INTEGRATION_PLAN.md`)

> Note: In this repo snapshot, only `Upload_module` source is present. The Thyrocare + Orders + Member modules are described below **as implemented per `INTEGRATION_PLAN.md`**.

### High-level lifecycle (happy path)
```mermaid
flowchart TD
  UI[Frontend] -->|POST /orders/create| Orders[OrdersModule]
  UI -->|POST /orders/verify| Orders
  Razorpay[RazorpayWebhook] -->|POST /orders/webhook| Orders
  Orders -->|book_thyrocare_for_order| Booking[ThyrocareBookingService]
  Booking -->|POST /partners/v1/orders| ThyrocareApi[ThyrocareAPI]
  ThyrocareApi -->|POST /thyrocare/webhook| ThyrocareWebhook[ThyrocareWebhookHandler]
  ThyrocareWebhook --> Db[(MySQL)]
  UI -->|GET /thyrocare/reports/my-reports| Reports[ThyrocareReportsAPI]
  UI -->|GET /thyrocare/reports/{patient_id}/download| Pdf[ReportDownloadAPI]
```

### Order + payment (source of truth = Razorpay webhook)
- **Create order (frontend initiated)**: `POST /orders/create`
  - validates cart + required appointment groups
  - creates internal Order + Razorpay order
- **Verify payment (frontend)**: `POST /orders/verify`
  - gives immediate feedback, but **does not finalize** confirmation
- **Confirm payment (webhook)**: `POST /orders/webhook`
  - verifies Razorpay signature
  - transitions internal payment/order state to **CONFIRMED/COMPLETED** (idempotent)
  - triggers Thyrocare booking (non-blocking) after payment confirmation

### Thyrocare booking (how many Thyrocare order IDs you get)
Core split rule (as documented):
- Backend buckets items by **visit key**:
  - `(address_id, appointment_date, appointment_start_time)`
- Within a visit bucket:
  - **Exactly 1 unique member** → **1 Thyrocare order** containing multiple items
  - **>1 unique member** → **split per product** (1 Thyrocare order per product, each order contains patients list)

Example (same address+slot):
- **2 members × 2 products** (CBC + Lipid) → **2 Thyrocare orders** (CBC order, Lipid order), each with patients `[A,B]`
- **1 member × 2 products** → **1 Thyrocare order** containing items `[CBC, Lipid]` for that patient

### Thyrocare vendor endpoints called (documented)
From `INTEGRATION_PLAN.md` the backend uses Thyrocare B2C partner APIs including:
- **Auth**: `POST /partners/v1/auth/login` (bearer token; cached/auto-refreshed)
- **Book**: `POST /partners/v1/orders`
- **Slots**: `POST /partners/v1/slots/search`
- **Order details/status**: `GET /partners/v1/orders/{orderId}`, `GET /partners/v1/orders/{orderId}/status`
- **Report PDF**: `GET /partners/v1/.../reports/{leadId}?type=pdf`

### Thyrocare webhook (tracking + member mapping)
- **Backend endpoint**: `POST /thyrocare/webhook`
- **What it updates (documented tables)**:
  - `thyrocare_order_tracking` (current status, phlebo, appointment, member_ids, order_item_ids, timestamps)
  - `thyrocare_order_status_history` (timeline history; idempotent by distinct status/description)
  - `thyrocare_patient_tracking` (per patient/lead: report availability, report URL, mapping to member/user)
- **Critical mapping detail**:
  - booking payload includes `externalPatientId = member.id`
  - webhook uses `externalPatientId` to map each vendor patient back to the correct internal `member_id` (avoids wrong mapping in multi-member visits)

### “Report ready” (two parallel signals)
- **Vendor status timeline**: driven by webhook → `thyrocare_order_tracking.current_order_status`
- **Structured results rows**: backend extracts lab parameters into `ThyrocareLabResult` so `GET /thyrocare/reports/my-reports` returns `results[]` per member

## Backend flow (Bloodtests) — External Upload integration (verified from code)

### Upload report (create + optional extraction)
- **Endpoint**: `POST /upload/report` (`Bloodtests/Upload_module/Upload_router.py`)
- **Inputs**:
  - `file` (required; `.pdf`, `.png`, `.jpg`, `.jpeg`)
  - `member_id` (optional)
  - `lab_name` (optional)
- **Storage**:
  - streams file to `Bloodtests/uploads/<uuid>.<ext>` (server-local)
  - calculates `sha256` hash for dedupe retries
- **DB tables written** (`Bloodtests/Upload_module/Upload_model.py`):
  - `uploaded_reports` (one row per uploaded file; unique on `user_id + member_id + file_hash`)
  - `uploaded_lab_results` (one row per extracted parameter line; unique on `uploaded_report_id + test_code + description`)
- **PDF extraction behavior**:
  - if file is PDF, attempts `extract_and_parse_pdf(...)`
  - maps organ + group via `ThyrocareTestParameter` lookup
  - computes `indicator` from numeric value and range: `LOW | NORMAL | HIGH`
  - extraction failures do **not** fail the upload (best-effort; rolls back only extracted rows)

### List uploaded reports (My-Reports compatible)
- **Endpoint**: `GET /upload/reports/my-reports?member_id=...`
- **Response**:
  - `data[]` includes each uploaded report row with nested `results[]` (extracted parameters)
  - shaped to merge into the same “My Reports” UI list

### Download uploaded report file
- **Endpoint**: `GET /upload/reports/{report_id}/download`
- **Behavior**:
  - verifies `user_id` ownership
  - returns the stored file as a `FileResponse` with best-effort `media_type` and `filename`

## Scenarios (quick reference)

### Multi-member booking (same slot)
- **Expected**: split bookings per product (multiple Thyrocare order IDs)
- **Why**: prevents cross-member merging issues; webhook mapping relies on `externalPatientId`

### Multi-product + multi-member combinations (how Thyrocare bookings split and how Order Details shows it)

The backend split rule (from `INTEGRATION_PLAN.md`) is driven by the **visit key**:
- **Visit key**: `(address_id, appointment_date, appointment_start_time)`
- Backend creates one Thyrocare booking per visit key, **then applies the “members in visit” split rule**:
  - **1 unique member in that visit** → keep items together
  - **>1 unique member in that visit** → split per product

The frontend `src/pages/OrderDetailsPage.tsx` renders this using:
- `order.items[]` (each is a product/pack line)
- each line’s `member_address_map[]` (one row per member/address selection; includes `scheduled_date`, `order_status`, and may include `thyrocare_order_id`)
- `thyrocareIdsForOrderItem(item)` which builds **all Thyrocare visit ids** for that product line (from line-level ids + `member_address_map[].thyrocare_order_id`)

#### Case A: CBC has members A,B; Lipid has members C,D (same address + same slot)
- **Booking outcome** (visit key is same for both products):
  - The “visit” contains **>1 unique member**, so the backend books **1 Thyrocare order per product**:
    - ThyrocareOrder_CBC: patients `[A,B]`
    - ThyrocareOrder_Lipid: patients `[C,D]`
- **Order Details UI**
  - Shows 2 product cards (CBC line, Lipid line)
  - Expanding CBC loads **one visit timeline** for `ThyrocareOrder_CBC` and shows patients A,B under that visit
  - Expanding Lipid loads **one visit timeline** for `ThyrocareOrder_Lipid` and shows patients C,D under that visit

#### Case B: Same as A, but **same address and different slots** (or different days)
- **Booking outcome**
  - Different visit keys → backend books **separate Thyrocare orders per visit key** (even if same product)
  - Practically you’ll see multiple Thyrocare order IDs across items (`thyrocare_order_ids` / `member_address_map[].thyrocare_order_id`)
- **Order Details UI**
  - Each product card can expand into **Visit 1 / Visit 2 / ...** (one per Thyrocare order id in `thyrocareIdsForOrderItem`)
  - Each visit shows its own timeline + its own patients list

#### Case C: Same as A, but **different addresses** (same slot time or not)
- **Booking outcome**
  - Different `address_id` changes the visit key → separate Thyrocare bookings per address
- **Order Details UI**
  - The “Members & addresses” section under the product line shows each member with the specific address
  - Expanding the product shows separate visits when Thyrocare ids are separate per address/visit

#### Case D: One patient has multiple products (A has CBC + Lipid), same address + same slot
- **Booking outcome**
  - The visit has **1 unique member**, so backend keeps items together → **1 Thyrocare order** containing multiple items for patient A
- **Order Details UI**
  - You still see **two product cards** (CBC line, Lipid line)
  - Each product may show the **same Thyrocare order id** behind the scenes
  - Expanding either product loads the same visit details; patients list will contain A

#### Case E: One product with multiple members (CBC has A,B), same address + same slot
- **Booking outcome**
  - Visit has **>1 unique member**, so it remains one booking for that product (it is already “per product”)
  - ThyrocareOrder_CBC: patients `[A,B]`
- **Order Details UI**
  - One product card (CBC) → expand shows one visit and patients A,B
  - “Members & addresses” lists A and B with their scheduled date/status

### How order tracking is shown on Order Details (important UI rules)
- **Orders list vs details**
  - Orders list (`/orders`) shows only the internal order status from `GET /orders/list` (no vendor calls).
  - Order details (`/order-details`) shows vendor tracking only when a Thyrocare id exists for that line/row.
- **Timeline source**
  - When you expand a product card, the page loads:
    - `GET /thyrocare/orders/my-orders` (status history + current status, preferred when present)
    - `GET /thyrocare/orders/{thyrocare_order_id}/order-details` (patients + payment + fallback history)
  - If vendor history is missing, the page shows a **fallback stepper** based on the best-known fields.

### When “View report” shows in the frontend (two places)
`OrderDetailsPage.tsx` can show “View report” buttons:
- **Inside expanded Visit → Reports list**
  - For each expanded **product card**, the page derives one-or-more Thyrocare “visit ids” using `thyrocareIdsForOrderItem(item)`.
  - For each visit id it loads `GET /thyrocare/orders/{thyrocare_order_id}/order-details` and reads `details.patients[]`.
  - For each vendor patient row in `patients[]`, the button is shown when a **patient identifier is available**:
    - `patientId = p.id || p.lead_id || p.patient_id`
    - If `patientId` is missing, that patient row **will not** show “View report”.
  - Member mapping shown beside this button is best-effort:
    - `memberIdForPatient = resolveMemberIdForItemAndVisit(item, tcId, p.name, patientIndex)`
    - This is used to navigate into `/report` with the same stable keying the Reports list uses (so it opens the correct member’s report row).
  - Click behavior:
    - prefer navigating to `/report?id=...` using the same keying as Reports list (stable list-row identity)
    - else it tries direct download:
      - `GET /thyrocare/reports/{patient_id}/download`
      - fallback: `GET /thyrocare/orders/{thyrocare_order_id}/reports/{lead_id}?type=pdf`
- **Inside “Members & addresses” rows**
  - Each `member_address_map[]` row is rendered under the product card.
  - The page tries to resolve a vendor patient id for that member row using the loaded visit details:
    - Looks at the effective Thyrocare visit id for that row (`row.thyrocare_order_id`, else the only visit id when there is exactly one).
    - Searches `order-details.patients[]` by **name match** to the member; else falls back to first patient.
    - `patientId = matchedPatient.id || matchedPatient.lead_id || matchedPatient.patient_id`
  - The button is shown when:
    - `patientId` exists, **and**
    - `row.order_status === "COMPLETED"` (UI gate; it’s intended to avoid showing report links before completion)
  - Status text for a row prefers vendor-derived milestone label when available (otherwise internal `order_status`)

### Download PDF button (Report Detail page)
- **Where**: `src/pages/ReportPage.tsx` (“Download PDF” button in the header)
- **Goal**: always download/open a PDF even when the backend returns different shapes (signed URL vs blob).
- **Resolution order** (best-effort):
  - **1) Use any embedded URL on the report row**: `pickReportDownloadUrl(report)`
  - **2) If we have a lab `patient_id/lead_id`**: call `GET /thyrocare/reports/{patient_id}/download` (via `downloadPatientReport(...)`) and extract URL
  - **3) If we have `thyrocare_order_id` + `lead_id`**: call `GET /thyrocare/orders/{thyrocare_order_id}/reports/{lead_id}?type=pdf` (via `fetchThyrocareReport(...)`) and extract URL
  - **4) If no usable URL is returned**: download as binary and save:
    - `api.getBlob("/thyrocare/orders/{thyrocare_order_id}/reports/{lead_id}?type=pdf")`
    - else `api.getBlob("/thyrocare/reports/{patient_id}/download")`
- **Result**:
  - If the response contains an **absolute URL**, the app opens it in a new tab.
  - Otherwise it downloads a **Blob** and triggers a file save as `<reportTitle>.pdf`.

## Health Metrics + Compare Reports (data pulled from My Reports)

### Shared source of truth: “My Reports” payload
- Both screens ultimately rely on the same normalized report lines the Reports hub uses:
  - **Lab (Thyrocare/Nucleotide)**: `fetchMyReports(memberId?)` → `GET /thyrocare/reports/my-reports`
  - **Uploaded**:
    - merged into `fetchMyReports(...)` as best-effort
    - and also fetched directly on Compare page via `GET /upload/reports/my-reports`
- In both cases, the UI reads **arrays of parameter lines** from one of these keys when present:
  - `results`, `lab_results`, `thyrocare_results`, `biomarkers`, `parameters`, etc.

### Health Metrics page (organ cards)
- **Where**: `src/pages/HealthMetricsPage.tsx`
- **API**: `fetchMyReports(currentMember?.member_id)`
- **How it computes metrics**:
  - extracts report date using `pickSampleCollectedTimestampFromReport(row)` (falls back to other date fields)
  - extracts parameter lines from `results[]` (or other supported arrays)
  - groups lines by **organ** using:
    - `line.category` (preferred; upload flow sets `category = organ` in DB)
    - fallback: `line.organ`
  - treats `indicator` / status text as: **Normal vs abnormal** and computes a score per organ:
    - \(score = round(normalCount / totalCount * 100)\)
  - trend arrow compares latest vs previous report score for that organ

### Compare Reports page (parameter trend chart)
- **Where**: `src/pages/CompareReportsPage.tsx`
- **APIs**:
  - `fetchMyReports(memberId?)` (lab reports)
  - `fetchUploadedReports(memberId?)` (uploaded reports)
- **How it compares**:
  - auto-picks **two most recent reports across both sources**
  - parses “biomarkers” from each selected report by normalizing fields:
    - name/description/test_code → parameter name
    - test_value/value/result → numeric value
    - normal_val/reference_range/range → low/high when possible
  - builds a time series and plots a trend line for the selected parameter

### Payment verified on UI but webhook not received yet
- **Expected**: order shows “processing / waiting”
- **Why**: backend finalizes order only on Razorpay webhook; booking is triggered after confirmation

### Thyrocare webhook arrives multiple times / out of order
- **Expected**: idempotent status-history updates; tracking row updated to latest

### Upload same report file again (retry)
- **Expected**: backend dedupes using `sha256` + (`user_id`,`member_id`)
- **Behavior**: returns existing report row; deletes the newly uploaded duplicate file

