# Concord web app

React 19 + Vite + Tailwind v4, react-router 7, recharts, lucide icons. Dark "night ledger" theme; fonts are self-hosted (Bricolage Grotesque, Hanken Grotesk, Saira Condensed via @fontsource).

## Pages

- `/` landing page with an interactive "triplicate" demo, `/login`, `/register`
- `/app` overview: money at risk, recovered, touchless rate, pay-run summary, MSME alerts, weekly chart, activity
- `/app/inbox` drag-and-drop upload (any order, auto-detected type), sample purchases, document corrections
- `/app/purchases` and `/app/purchases/:id` every PO with its three document slots, line-by-line comparison, checks
- `/app/disputes` and `/app/disputes/:id` evidence, AI-drafted email (3 tones), approval, send by email or WhatsApp, vendor reply assessment, debit note, history
- `/app/vendors` and `/app/vendors/:id` risk score breakdown, GSTIN check, MSME details, PO-vs-invoice price history
- `/app/payments` pay run with bank upload file, 8-week cash forecast, MSME §43B(h) deadlines, bank statement reconciliation
- `/app/gst` GSTR-2B reconciliation: input tax credit at risk, suppliers to chase
- `/app/ask` questions answered from the company's own data
- `/app/settings` company, matching rules, autopilot, team roles, API keys and email intake
- `/respond/:token` public vendor portal (no login)

Ctrl/⌘ K opens search from anywhere in the app.

## Run locally

```bash
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

## Deploy on Vercel

Set `VITE_API_URL=https://<your-render-service>.onrender.com/api` and redeploy. `vercel.json` already rewrites all routes to the SPA.
