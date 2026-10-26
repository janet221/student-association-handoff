"use client";

import { ErrorPoster } from "@/components/error-poster";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0, minHeight: "100vh", background: "#fff7fa" }}>
        <ErrorPoster reset={reset} />
      </body>
    </html>
  );
}
