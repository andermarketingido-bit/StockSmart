import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Replenishment",
  description: "Upload inventory data and get 7-day reorder recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
