"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <main className="shell empty-state" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <strong>Произошла ошибка. Попробуйте позже.</strong>
      <button className="button button-small" onClick={reset} style={{ marginTop: 15 }}>
        Повторить
      </button>
    </main>
  );
}
