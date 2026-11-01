"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-light">Não foi possível carregar a página</h1>
      <p className="text-nevoa">Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-full bg-brasa px-6 font-medium text-noite"
      >
        Tentar de novo
      </button>
    </main>
  );
}
