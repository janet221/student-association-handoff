import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "系學會跨屆工作交接系統",
  description: "讓歷屆經驗直接成為本屆可執行的工作流程。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
