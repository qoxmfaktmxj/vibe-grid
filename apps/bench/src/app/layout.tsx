import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeGrid Bench",
  description: "Benchmark surface for large-data and interaction regression checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
