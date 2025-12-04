## Stock Insights Dashboard

A small Next.js + TypeScript tool that lets you paste a list of stock symbols (NSE/BSE or US) and fetch, for each stock:

- **52-week high & low**
- **Current market price**
- **% difference from 52-week high/low**
- **Latest news (top 3 headlines, with source and timestamp)**
- **Bulk / block deals hook** (placeholder you can extend with your own NSE/BSE integration)

The UI is a single page with:

- **Textbox** to paste comma-separated symbols (e.g. `RELIANCE.NS, TCS.NS, AAPL`)
- **Button**: “Fetch Stock Insights”
- **Table** of results, one row per symbol

Backend is implemented using **Next.js route handlers** under `/api/stock-insights`.

---

### Tech Stack

- **Frontend**: React + TypeScript (Next.js App Router)
- **Backend**: Next.js route handler (`app/api/stock-insights/route.ts`)
- **Styling**: Custom CSS in `app/globals.css`

---

### Getting Started

1. **Install dependencies**

```bash
cd /Users/dhanendra/Desktop/apps/ipo-detail
npm install
```

2. **Configure environment variables**

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following key (required):

```bash
ALPHAVANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

You can get an API key from the Alpha Vantage website (free tier is available).

3. **Run the development server**

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

### API Integrations

#### Price, 52-week High/Low

- Implemented in: `lib/financeApi.ts` (`fetchPriceAndRange`)
- Provider: **Alpha Vantage** `TIME_SERIES_DAILY_ADJUSTED`
- Logic:
  - Uses the most recent close as **current price**
  - Scans approximately 52 weeks of daily candles (last 365 days)
  - Computes max high as **52W High**, min low as **52W Low**

#### News (Top 3 Headlines)

- Implemented in: `lib/financeApi.ts` (`fetchNewsForSymbol`)
- Provider: **Alpha Vantage** `NEWS_SENTIMENT`
- Logic:
  - Fetches recent headlines for the given ticker
  - Maps title, source/author, timestamp, and URL
  - Frontend shows **top 3** headlines in a compact list

#### Bulk / Block Deals

- Implemented in: `lib/bulkDeals.ts` (`fetchBulkDealsForSymbol`)
- **By default this returns an empty array** because NSE/BSE do not expose a simple, stable public JSON API.
- You can extend this function to:
  - Scrape NSE/BSE bulk/block deal reports
  - Use a paid data vendor
  - Query your own database or internal service

The frontend will automatically render up to 3 recent deals per symbol, with:

- Date
- Buyer → Seller
- Quantity
- Price
- Exchange (NSE/BSE/US/etc.)

---

### Calculations

Utility functions live in `lib/calculations.ts`:

```ts
pctFromHigh = ((currentPrice - high52) / high52) * 100;
pctFromLow  = ((currentPrice - low52) / low52) * 100;
```

In code:

```ts
export function pctFromHigh(currentPrice: number, high52: number): number {
  if (!isFinite(currentPrice) || !isFinite(high52) || high52 === 0) {
    return NaN;
  }
  return ((currentPrice - high52) / high52) * 100;
}

export function pctFromLow(currentPrice: number, low52: number): number {
  if (!isFinite(currentPrice) || !isFinite(low52) || low52 === 0) {
    return NaN;
  }
  return ((currentPrice - low52) / low52) * 100;
}
```

The frontend displays:

- `% from 52W High` with green/red coloring depending on sign
- `% from 52W Low` similarly

---

### API Shape (Per Stock)

The `/api/stock-insights` endpoint accepts:

```json
{
  "symbols": "RELIANCE.NS, TCS.NS, AAPL"
}
```

or

```json
{
  "symbols": ["RELIANCE.NS", "TCS.NS", "AAPL"]
}
```

And returns:

```json
{
  "results": [
    {
      "symbol": "RELIANCE.NS",
      "market": "NSE",
      "currentPrice": 1234.56,
      "high52": 1500.0,
      "low52": 900.0,
      "pctFromHigh": -17.71,
      "pctFromLow": 37.18,
      "latestNews": [
        {
          "title": "Headline 1",
          "source": "News Source",
          "publishedAt": "2025-01-02T10:00:00.000Z",
          "url": "https://example.com/article"
        }
      ],
      "bulkDeals": [],
      "error": null
    }
  ]
}
```

Errors per symbol (invalid ticker, provider issues, etc.) are captured in the `error` field and surfaced in the UI as a small red badge.

---

### How to Swap/Extend Providers

- **Prices / 52W range**: edit `fetchPriceAndRange` in `lib/financeApi.ts`
  - You can replace Alpha Vantage with Yahoo Finance, IEX Cloud, or a custom API.
  - Keep the return shape `{ currentPrice, high52, low52 }` to avoid UI changes.

- **News**: edit `fetchNewsForSymbol` in `lib/financeApi.ts`
  - Replace with NewsAPI, MarketStack, Yahoo Finance RSS, etc.
  - Keep the `NewsItem` shape (`title`, `source`, `publishedAt`, `url`).

- **Bulk/Block deals**: implement `fetchBulkDealsForSymbol` in `lib/bulkDeals.ts`
  - Fill an array of `BulkDeal` objects and the UI will render them automatically.

---

### Running in Production

1. Build:

```bash
npm run build
```

2. Start:

```bash
npm run start
```

Make sure `ALPHAVANTAGE_API_KEY` is set in your environment before starting the server.
