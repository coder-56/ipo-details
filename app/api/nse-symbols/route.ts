import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * API endpoint to fetch NSE stock symbols from the CSV file.
 * Returns an array of stock symbols for autocomplete suggestions.
 */
export async function GET() {
  try {
    const csvPath = join(process.cwd(), "nse_stock_symbols.csv");
    const fileContent = readFileSync(csvPath, "utf-8");
    
    // Parse CSV: skip header, extract symbols
    const lines = fileContent.trim().split("\n");
    const symbols = lines.slice(1) // Skip header row
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.toUpperCase());
    
    return NextResponse.json({ symbols });
  } catch (error: any) {
    console.error("Error reading NSE symbols CSV:", error);
    return NextResponse.json(
      { error: "Failed to load stock symbols", symbols: [] },
      { status: 500 }
    );
  }
}

