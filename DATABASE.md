# DATABASE.md — IPEL TenderDesk (Supabase project `exohewumjfufufahiclt`, region ap-south-1)

**Step 1 is DONE. The database, rules, security and seed data already exist and are tested.**
Do NOT create, alter or drop tables, views, functions, triggers or policies. Do NOT write migrations.
Where this file differs from the data model in CLAUDE.md, THIS FILE WINS.

## Generate types (do this first)
```
npx supabase login
npx supabase gen types typescript --project-id exohewumjfufufahiclt > src/lib/database.types.ts
```
Use `createClient<Database>()` everywhere.

## Demo logins (password for all: `IpelDemo#2026`)
| Role | Email | Name |
|---|---|---|
| owner | ram.prasad@example.com | Ram Prasad |
| tender | tender@example.com | Anita Kulkarni |
| purchase | purchase@example.com | Rakesh Menon |
| accounts | accounts@example.com | Priya Iyer |
| logistics | logistics@example.com | Suresh Yadav |

Current user's role: `supabase.rpc('fn_my_role')`. Profiles: table `profiles` (id = auth user id).

## Read from VIEWS, not raw tables, for any computed number
| Screen | Source | Key columns |
|---|---|---|
| Dashboard KPIs | `v_dashboard_kpis` (1 row) | win_rate_fy_pct, bid_pipeline_value, order_book_value, deliveries_due_45d(_value), deliveries_overdue, ld_exposure_open, locked_pos, extensions_due, receivables_total, ar_0_30 / ar_31_60 / ar_61_90 / ar_90_plus, ready_to_claim, payables_total, bg_live_value, bg_expiring_30d, certificates_expiring_30d, reminders_due_today |
| Tender register + workspace header | `v_tender_summary` | item_count, total_cost, total_bid, margin, margin_pct, lines_incomplete, open_required_docs, open_submission_checks, days_to_submission |
| Orders list + order header | `v_po_overview` | status, effective_due, days_to_due, pending_qty/value, latest_vendor_eta, vendor_eta_late, projected_delivery, weeks_late_projected, ld_exposure, extension_due, open_discrepancies, payment_docs_missing (text[]), ready_to_claim, delay_clause_text |
| Order lines | `v_po_lines` | ordered_qty, delivered_qty, pending_qty, pending_value |
| Receivables | `v_invoice_balance` | received, tds, gst_tds, ld_deducted, balance_due, age_days, age_bucket |
| Payables / vendor POs | `v_vendor_po_balance` | po_value, paid, payable_now (owed for goods received), balance_due (open commitment), eta_after_client_due |
| Part-number history | `v_part_history` | every past tender line for a product: client, status, qty, cost, bid, vendor |

Money is numeric (INR). Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

## Actions: use these RPCs (owner-only ones are enforced in the database)
| Action | Call | Who |
|---|---|---|
| Approve bid | `rpc('approve_tender', { p_tender_id, p_comment })` | owner |
| Return bid to team | `rpc('return_tender', { p_tender_id, p_comment })` — also clears the approval, so a re-sent bid needs approving again | owner |
| Acknowledge client PO | `rpc('acknowledge_po', { p_po_id })` | owner |
| Release PO lock | `rpc('release_po_lock', { p_po_id })` — only after every open `po_discrepancies` row has `amendment_ref` | owner |
| Record a dispatch | `rpc('record_dispatch', { p_po_id, p_dc_number, p_dispatched_on, p_signed, p_lines: [{ client_po_item_id, qty }] })` — challan and lines in one transaction; returns the dispatch id | anyone |
| Refresh alerts | `rpc('fn_refresh_alerts')` — call on dashboard load; idempotent; creates extension-letter drafts + reminders | anyone |

Everything else is plain insert/update on tables (all signed-in users have full access via RLS).

## Rules the DATABASE enforces — show its error message in a toast, do not duplicate the logic
- Tender → `owner_review` fails if any line lacks vendor, cost or bid price.
- Tender → `submitted` fails unless owner approved AND every `submission_check` item is done.
- Tender → `lost` fails without `loss_reason`.
- Client PO lines are auto-compared with the bid (part number, qty, unit price, due date). Any mismatch writes `po_discrepancies` and sets PO status `locked`.
- Dispatch is refused unless PO status is `acknowledged` or `in_execution`; dispatch qty cannot exceed pending qty.
- Invoice is refused until every line is fully delivered. One invoice per PO.
- Status changes the DB makes itself — never set these from the UI: `locked`, `in_execution` (on first dispatch), `fully_delivered`, `invoiced`, `closed` (when receipts + deductions cover the invoice).
- Every insert/update/delete on business tables is written to `activity_log` with the user.

## Status flows
Tender: identified → evaluation → preparation → owner_review → submitted → won | lost | cancelled | not_materialised
Client PO: received → (locked ⇄ received) → acknowledged → in_execution → fully_delivered → invoiced → closed

## Extension letters
`extension_requests.letter_text` holds a ready draft. Show it in a print-friendly page (browser Save as PDF). Status: draft → sent → approved (then set `client_pos.extended_due_date`) | rejected. Nothing is ever emailed.

## Documents
Table `documents` (entity_type: tender | client_po | dispatch | vendor | company; doc_type: bid_copy | po | invoice | dc | tender_doc | certificate | amendment | other). Private storage bucket `documents`. Seeded document rows point to `demo/...` paths with NO real files behind them — show them as "on file (demo)" and do not try to download them.

## Seed data (all fictitious)
5 clients · 20 OEMs, 15 suppliers, 10 subcontractors · 120 part numbers with price history · 158 tenders (22 won, 110 lost, 8 cancelled, 6 not materialised, 12 open; 1–45 lines each; FY win rate ≈15%) · 22 client POs covering every stage: 2 locked (PO/ADS/2026/1020 qty mismatch, PO/DMSP/2026/1021 price and due-date mismatch), 3 due within 45 days, 2 overdue with LD building, 1 late delivery with LD deducted, 4 part-paid, 2 ready to claim, 2 closed · reminders and 4 extension drafts already generated.
Sample values, label them "sample" in the UI: LD 0.5%/week capped at 10% (1%/5% on some tenders), PBG 10% of PO, EMD 2% of bid, TDS 1%, GST-TDS 2%, extension trigger 45 days before due.

## Demo-ready records
- Locked PO to show amendment → release: **PO/ADS/2026/1020**
- Extension draft to show: **PO/DMSP/2026/1011** (due in 15 days, one vendor late)
- Overdue with LD accruing: **PO/ADS/2025/1015**
- Ready to claim: **PO/NSPW/2025/1003**, **PO/SAL/2025/1004**
- Missing payment documents: **PO/NSPW/2026/1008** (invoice copy + one unsigned challan)
- Bids waiting for owner approval: 2 tenders in `owner_review` (one with 40 lines)
