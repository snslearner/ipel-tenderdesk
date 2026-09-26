# IPEL TenderDesk

Tender-to-cash desk for IPEL Ltd, a defence supplier that bids on government tenders: from bid preparation and owner
approval to client POs, vendor sourcing, dispatch, invoicing and payment follow-up. Hackathon MVP.

**All data is fictitious.** Names, companies, part numbers, amounts and documents are invented for the demo.

**Live app:** https://ipel-tenderdesk.vercel.app

## Try it

Open the live app and **tap any demo user to sign in**, no typing needed. The five users have different roles:

| Demo user | Role | Can additionally |
|---|---|---|
| Ram Prasad | Owner | Approve or return bids, acknowledge client POs, release PO locks |
| Anita Kulkarni | Tender | |
| Rakesh Menon | Purchase | |
| Priya Iyer | Accounts | |
| Suresh Yadav | Logistics | |

Everyone can read everything. Owner-only actions are enforced in the database, not just hidden in the UI.
"Switch user" in the header returns to the sign-in page. The shared demo password (for the email form) is `IpelDemo#2026`.

Good records to look at: locked PO **PO/ADS/2026/1020** (amendment then release), extension letter on
**PO/DMSP/2026/1011**, LD building on **PO/ADS/2025/1015**, ready to claim **PO/NSPW/2025/1003**, and two bids waiting in
Owner review. See [DATABASE.md](DATABASE.md) for the full list.

## Screens

- **Dashboard**: the owner's view. Win rate this FY, bid pipeline, order book, deliveries due in 45 days, overdue
  deliveries, LD exposure, locked POs, extensions due, receivables by age (chart), ready to claim, payables, guarantees
  and certificates expiring, and "Needs you today" (open reminders due). Every card opens the list behind its number.
- **Tenders**: register with status, client and search filters. Each tender has a workspace:
  - **Items**: vendor, cost and bid price per line, with margin.
  - **Checklist**: required documents and submission checks to tick.
  - **Guarantees**: EMD and PBG bank guarantees.
  - **History**: past bids for each line's part number.
  - **AI checklist**: upload a tender PDF; Claude suggests line items, required documents and submission checks, and
    you tick which to keep. Two fictitious tender PDFs are linked on the tab to try it.
  - Buttons follow the bid flow: send for owner review, approve or return (owner only), submit, mark won or lost
    (lost needs a reason).
- **Orders**: client POs with due dates, pending value, LD exposure and flags. Each PO has tabs:
  - **Lines**: ordered, delivered, pending.
  - **Discrepancies**: PO vs bid; record amendment references; owner releases the lock and acknowledges.
  - **Sourcing**: vendor POs, ETAs (red when after the client due date) and payments.
  - **Inspection**: DGQA, buyer QA or third-party inspections.
  - **Dispatches**: delivery challans; new dispatch with quantity per line.
  - **Extension**: the drafted extension letter, a print view (save as PDF), and its status.
  - **Invoice & payments**: invoice once fully delivered, receipts with TDS, GST-TDS and LD deductions, balance
    due, and the payment claim checklist.
- **Vendors**: OEMs, suppliers and subcontractors with ISO flag and rating; each vendor shows certificates (red when
  expiring within 30 days), price history and vendor POs.
- **Clients**: defence wings, DPSUs and private manufacturers with their tenders and orders.
- **Products**: search by part number; each part shows prices by vendor and every past bid (won or lost).
- **Reminders**: open reminders grouped by role, "Mine" for your role, mark done, add your own.

Phones get a bottom bar (Dashboard, Tenders, Orders, Reminders, More) and cards instead of tables.

## Sample values

These are placeholders, labelled "sample" in the app, not IPEL's real terms:

| What | Sample value |
|---|---|
| Liquidated damages (LD) | 0.5% per week, capped at 10% (some tenders 1% / 5%) |
| Performance bank guarantee | 10% of PO value |
| EMD | 2% of bid value |
| TDS / GST-TDS on receipts | 1% / 2% |
| Extension request trigger | 45 days before the due date |
| Expiry warnings | Guarantees and certificates within 30 days |

## Run locally

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key. `ANTHROPIC_API_KEY` is optional:
   without it the AI checklist tab says it is not configured and everything else works.
2. `npm install`, then `npm run dev` and open http://localhost:3000

Stack: Next.js (App Router) on Vercel, Supabase (Postgres, Auth, Storage) in Mumbai, Tailwind and shadcn/ui, and the
Anthropic API (`claude-sonnet-5`) from a server route only.

Regenerate database types after a schema change:

```
npx supabase gen types typescript --project-id exohewumjfufufahiclt > src/lib/database.types.ts
```

Regenerate the demo tender PDFs: `node scripts/make-demo-pdfs.mjs`

## Tests

- `npm run test`: Vitest unit tests for the business rules mirrored in TypeScript.
- `npm run test:e2e`: Playwright smoke suite on desktop and a 390px phone. Set `PLAYWRIGHT_BASE_URL` to test a deployed
  URL; otherwise it builds and starts locally. `PW_CHANNEL=msedge` uses installed Edge. The suite signs in once per
  role, but Supabase Auth limits sign-ins per IP, so avoid running it twice within a few minutes. Tests that change
  seeded data (bid approval, PO lock release) restore it afterwards.
