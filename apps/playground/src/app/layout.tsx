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
  description: "업무형 공통 Grid 제품을 검증하고 발전시키는 단일 테스트 허브",
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
              <div>
                <span className="app-kicker">VibeGrid Product Lab</span>
                <h1 className="app-title">한 포트 검증 허브</h1>
              </div>
              <p className="app-copy">
                Grid Lab, Bench, Compatibility를 하나의 흐름으로 묶어 업무형 grid의 행
                선택 UX, 대용량 성능, IBSheet 대체 가능성을 빠르게 검증할 수 있게
                만들었습니다.
              </p>
            </div>
            <AppNav />
          </header>
          <div className="page-stack">{children}</div>
        </div>
      </body>
    </html>
  );
}
