import type { Metadata } from "next";
import "./globals.css";
import { GlobalExperience } from "@/components/global-experience";

export const metadata: Metadata = {
  title: "系學會跨股協作與換屆交接平台",
  description: "整理活動日期、跨股協作、公告與換屆交接資料。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><GlobalExperience />{children}</body>
    </html>
  );
}
