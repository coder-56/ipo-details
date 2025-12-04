import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Insights Dashboard",
  description:
    "Fetch stock prices, 52-week highs/lows, news, and bulk/block deals in one place."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


