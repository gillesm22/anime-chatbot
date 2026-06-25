"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 20, color: "white", background: "#0d0d12", minHeight: "100vh" }}>
          <h2>Something went wrong</h2>
          <button onClick={reset} style={{ marginTop: 10, padding: "8px 16px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
