import type { Metadata } from "next";
import { AppNav } from "./AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeGrid Playground",
  description: "Manual validation surface for the standalone VibeGrid product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div
          style={{
            maxWidth: 1480,
            margin: "0 auto",
            padding: "28px 24px 12px",
            display: "grid",
            gap: 18,
          }}
        >
          <header
            style={{
              display: "grid",
              gap: 14,
              border: "1px solid #d9e4f1",
              borderRadius: 24,
              padding: 20,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                  VibeGrid Test Hub
                </div>
                <h1 style={{ margin: "8px 0 0", fontSize: 28 }}>한 포트 검증 허브</h1>
              </div>
              <div style={{ color: "#475569", lineHeight: 1.7, maxWidth: 620 }}>
                업무형 grid 테스트는 한 앱 안에서 이동하는 게 가장 편합니다.
                지금부터는 `Grid Lab`, `Bench`, `Compatibility`를 이 허브 안에서
                이동하며 확인하면 됩니다.
              </div>
            </div>
            <AppNav />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
