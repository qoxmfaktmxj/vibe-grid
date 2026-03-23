import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import { AppNav } from "./AppNav";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeGrid Playground",
  description: "업무형 공통 Grid 제품을 검증하고 발전시키는 그리드 검증 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="app-header__top">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="app-kicker">VibeGrid Product Lab</span>
              </div>
              <p className="app-copy">
                업무형 grid의 행 선택 UX, 대용량 성능, 공통 사용 가능성을 빠르게
                검증할 수 있게 만들었습니다.
              </p>
            </div>
            <h1 className="app-title">그리드 검증 플랫폼</h1>
            <AppNav />
          </header>
          <div className="page-stack">{children}</div>
        </div>
      </body>
    </html>
  );
}
