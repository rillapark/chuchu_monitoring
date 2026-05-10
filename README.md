# Korean Equity Perp Arbitrage Monitor
Next.js + TypeScript dashboard for monitoring KRX vs Hyperliquid price dislocations.

## Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Env
- KIS_APP_KEY / KIS_APP_SECRET / KIS_BASE_URL
- EXCHANGE_API_KEY (optional fallback supported)
- NEXT_PUBLIC_REFRESH_INTERVAL_MS=5000

## Deploy (Vercel)
- Import repo in Vercel
- Set env vars in Project Settings
- Deploy

## API Sources
- Hyperliquid info endpoint
- KIS domestic stock quotation
- Exchange-rate API (or fallback open.er-api)

## Known limitations
- KRX holiday API integration TODO
- Short availability not checked
- Monitoring only, no trade execution

## Disclaimer
This tool is for monitoring/education only and is not investment advice.
