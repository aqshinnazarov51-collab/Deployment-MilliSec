"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <html lang="ru">
      <body>
        <main style={{ maxWidth: 720, margin: "12vh auto", padding: 24, fontFamily: "sans-serif" }}>
          <p>Произошла ошибка. Попробуйте позже.</p>
          <button onClick={reset}>Повторить</button>
        </main>
      </body>
    </html>
  );
}
