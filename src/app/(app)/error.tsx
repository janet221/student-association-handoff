"use client";

import { ErrorPoster } from "@/components/error-poster";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPoster reset={reset} />;
}
