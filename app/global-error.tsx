"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ec",
          color: "#3d2c1e",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: 0 }}>
            This site is temporarily unavailable
          </h1>
          <p style={{ marginTop: 16, lineHeight: 1.6, fontSize: 15 }}>
            Saved content could not be loaded. Placeholder pages are never
            shown, so nothing she uploaded is overwritten. Refresh to try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 999,
              background: "#2f4a3a",
              color: "#f7f3ec",
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
