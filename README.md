# Puppy Pathfinder Quiz

Frontend for the EZWhelp product recommendation quiz — guides customers to the right whelping bundle or add-on products based on their situation.

## Overview

A two-path quiz that recommends products from the EZWhelp Shopify catalog:

- **Path 1** — New customers → Whelping bundle recommendation (Starter, Essential, Pro, Elite, Play Yard, Condo)
- **Path 2** — Existing customers → Stage-based add-on recommendations

Submissions flow to the backend for database storage, Klaviyo sync, and Shopify cart pre-filling.

## Tech Stack

- Vite
- React 18
- TypeScript
- shadcn-ui
- Tailwind CSS
- React Query
- React Hook Form + Zod

## Development

```bash
npm install
npm run dev
```

Runs on `http://localhost:8080`.

## Environment Variables

See the backend repo for `.env.example` reference. Frontend env vars use the `VITE_` prefix.

## Related Repositories

- **Backend:** `datadigai-ctrl/test.server.js` (Node.js/Express API on Railway)

## Deployment

- Staging: Lovable preview URL
- Production: `quiz.ezwhelp.com` (coming soon, via Vercel)

## License

Proprietary. Built by DataDig AI (ARYAASTRA INC) for EZWhelp.
