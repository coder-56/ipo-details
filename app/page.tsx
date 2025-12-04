"use client";

import { useMemo, useState } from "react";
import type { StockInsight } from "../lib/types";

interface ApiResponse {
  results?: StockInsight[];
  error?: string;
}

function formatNumber(value: number | null, fractionDigits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  });
}

function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(2));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}%`;
}

function classifyDelta(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "delta-neutral";
  if (value > 0) return "delta-positive";
  if (value < 0) return "delta-negative";
  return "delta-neutral";
}

const STOCK_SUGGESTIONS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "ICICIBANK",
  "INFY",
  "AXISBANK",
  "SBIN",
  "ITC",
  "LT",
  "KOTAKBANK",
  "BHARTIARTL",
  "ULTRACEMCO",
  "MARUTI",
  "SUNPHARMA",
  "TITAN"
];

function stripExchangeSuffix(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".NS") || upper.endsWith(".BSE") || upper.endsWith(".BO")) {
    return upper.split(".")[0];
  }
  return upper;
}

export default function HomePage() {
  const [symbolsInput, setSymbolsInput] = useState("RELIANCE, TCS");
  const [pickerValue, setPickerValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [results, setResults] = useState<StockInsight[]>([]);

  const activeSymbols = useMemo(
    () =>
      symbolsInput
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [symbolsInput]
  );

  function handlePickerChange(next: string) {
    const value = next.trim().toUpperCase();
    setPickerValue(value);
    if (!value) return;

    const base = stripExchangeSuffix(value);
    if (!base) return;
    const already = activeSymbols.includes(base);
    if (!already) {
      const existing = symbolsInput.trim();
      const updated = existing
        ? `${existing.replace(/,+\s*$/, "")}, ${base}`
        : base;
      setSymbolsInput(updated);
    }
  }

  async function handleFetch() {
    setApiError(null);
    setValidationError(null);

    if (!activeSymbols.length) {
      setValidationError("Please enter at least one stock symbol.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stock-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: symbolsInput })
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        throw new Error(
          json?.error || `Request failed with status ${res.status}`
        );
      }

      setResults(json.results ?? []);
    } catch (err: any) {
      setApiError(err?.message ?? "Failed to fetch stock insights.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-root">
      <main className="page-shell">
        <header className="page-header">
          <h1 className="page-title">
            <span className="page-title-accent">
              <span className="page-title-accent-dot" />
            </span>
            Stock Insights Dashboard
          </h1>
          <p className="page-subtitle">
            Paste NSE/BSE or US symbols and get 52-week ranges, realtime
            pricing drift, latest headlines, and bulk/block deal hooks in one
            view.
          </p>
        </header>

        <section className="card">
          <div className="input-row">
            <div className="input-wrapper">
              <div className="input-label-row">
                <label className="input-label" htmlFor="symbols">
                  Symbols (comma-separated)
                </label>
                <span className="input-hint">
                  Example: RELIANCE, TCS, HDFCBANK, INFY
                </span>
              </div>
              <textarea
                id="symbols"
                className={`symbols-input ${
                  validationError ? "error" : ""
                }`.trim()}
                placeholder="RELIANCE, TCS, HDFCBANK, INFY"
                value={symbolsInput}
                onChange={(e) => setSymbolsInput(e.target.value)}
                rows={2}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 6
              }}
            >
              <div style={{ width: "100%" }}>
                <input
                  list="stock-suggestions"
                  value={pickerValue}
                  onChange={(e) => handlePickerChange(e.target.value)}
                  placeholder="Search & add NSE stocks (e.g. RELIANCE)"
                  style={{
                    width: "100%",
                    minWidth: 0,
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.8)",
                    padding: "7px 10px",
                    fontSize: 12
                  }}
                />
                <datalist id="stock-suggestions">
                  {STOCK_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="primary-button-spinner" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <span className="primary-button-icon">⚡</span>
                    Fetch Stock Insights
                  </>
                )}
              </button>
            </div>
          </div>

          {validationError && (
            <div className="error-banner">
              <span className="error-banner-strong">Input error: </span>
              {validationError}
            </div>
          )}
          {apiError && (
            <div className="error-banner">
              <span className="error-banner-strong">Request failed: </span>
              {apiError}
            </div>
          )}

          <div className="results-wrapper">
            <div className="results-header-row">
              <div>
                <div className="results-title">Results</div>
                <div className="chips-row">
                  <span className="chip">
                    Symbols:{" "}
                    {activeSymbols.length
                      ? activeSymbols.join(", ")
                      : "None yet"}
                  </span>
                  <span className="chip">
                    Rows: {results.length || "0"}
                  </span>
                  <span className="chip">
                Data: 52W High/Low, price, % from high/low, news
                  </span>
                </div>
              </div>
              <div className="status-text">
                {loading
                  ? "Talking to data providers…"
                  : results.length
                  ? "Showing latest fetched snapshot."
                  : "Hit “Fetch Stock Insights” to start."}
              </div>
            </div>

            <div className="table-scroll">
              {results.length === 0 ? (
                <div className="empty-state">
                  No data yet. Enter a few symbols and click{" "}
                  <strong>Fetch Stock Insights</strong>.
                </div>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Current Price</th>
                      <th>52W High</th>
                      <th>52W Low</th>
                      <th>% from 52W High</th>
                      <th>% from 52W Low</th>
                      <th>Latest News (Top 3)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr key={row.symbol}>
                        <td>
                          <div className="symbol-cell">
                            {stripExchangeSuffix(row.symbol)}
                          </div>
                          <div className="sub-muted">
                            {row.market !== "UNKNOWN"
                              ? `${row.market} market`
                              : "Market unknown"}
                          </div>
                          {row.error && (
                            <div className="badge badge-error">
                              {row.error}
                            </div>
                          )}
                        </td>
                        <td className="price-cell">
                          <div>{formatNumber(row.currentPrice)}</div>
                        </td>
                        <td>{formatNumber(row.high52)}</td>
                        <td>{formatNumber(row.low52)}</td>
                        <td className={classifyDelta(row.pctFromHigh)}>
                          {formatPct(row.pctFromHigh)}
                        </td>
                        <td className={classifyDelta(row.pctFromLow)}>
                          {formatPct(row.pctFromLow)}
                        </td>
                        <td>
                          {row.latestNews.length === 0 ? (
                            <span className="badge">No headlines</span>
                          ) : (
                            <ul className="news-list">
                              {row.latestNews.map((n, idx) => (
                                <li key={`${row.symbol}-news-${idx}`}>
                                  <div className="news-item-title">
                                    {n.url ? (
                                      <a
                                        className="news-link"
                                        href={n.url}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {n.title}
                                      </a>
                                    ) : (
                                      n.title
                                    )}
                                  </div>
                                  <div className="news-item-meta">
                                    {n.source} &middot;{" "}
                                    {new Date(
                                      n.publishedAt
                                    ).toLocaleString()}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="footer-note">
            <strong>Note:</strong> This tool uses external data providers such
            as Alpha Vantage. Percentages are computed as: pctFromHigh ={" "}
            <code>((currentPrice - high52) / high52) * 100</code>, pctFromLow =
            <code>((currentPrice - low52) / low52) * 100</code>.
          </div>
        </section>
      </main>
    </div>
  );
}


