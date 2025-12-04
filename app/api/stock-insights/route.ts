import { NextRequest, NextResponse } from "next/server";
import { buildStockInsight } from "../../../lib/financeApi";
import { fetchBulkDealsForSymbol } from "../../../lib/bulkDeals";
import type { StockInsightsResponse } from "../../../lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw =
      (Array.isArray(body.symbols) && body.symbols.join(",")) ||
      (typeof body.symbols === "string" ? body.symbols : "");

    const symbols = raw
      .split(",")
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) {
      return NextResponse.json(
        { error: "No symbols provided." },
        { status: 400 }
      );
    }

    const unique = Array.from(new Set(symbols));

    const insights = await Promise.all(
      unique.map(async (symbol) => {
        const base = await buildStockInsight(symbol);
        const bulkDeals = await fetchBulkDealsForSymbol(symbol);
        return { ...base, bulkDeals };
      })
    );

    const payload: StockInsightsResponse = {
      results: insights
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("stock-insights route error", err);
    return NextResponse.json(
      {
        error:
          err?.message ??
          "Unexpected server error while fetching stock insights."
      },
      { status: 500 }
    );
  }
}


