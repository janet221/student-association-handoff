"use client";

import { ErrorPoster } from "@/components/error-poster";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPoster reset={reset} />;
}
