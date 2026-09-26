# IPEL TenderDesk

Tender-to-cash desk for IPEL Ltd. Hackathon MVP. **All data is fictitious.**

Database, rules and seed data live in Supabase; see [DATABASE.md](DATABASE.md).

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key, service role key and Anthropic key.
2. `npm install`
3. `npm run dev` and open http://localhost:3000

Regenerate database types after any schema change:

```
npx supabase gen types typescript --project-id exohewumjfufufahiclt > src/lib/database.types.ts
```

## Demo logins

Password for all five: `IpelDemo#2026`

| Role | Email |
|---|---|
| owner | ram.prasad@example.com |
| tender | tender@example.com |
| purchase | purchase@example.com |
| accounts | accounts@example.com |
| logistics | logistics@example.com |

## Tests

- `npm run test`: Vitest unit tests
- `npm run test:e2e`: Playwright smoke suite. Set `PLAYWRIGHT_BASE_URL` to run against a Vercel preview; otherwise it builds and starts locally. Set `PW_CHANNEL=msedge` to use installed Edge instead of bundled Chromium.
