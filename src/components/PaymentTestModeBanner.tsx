const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Pagamenti non ancora attivi su questo sito.</div>;
  }
  if (clientToken.startsWith("pk_test_")) {
    return <div className="w-full border-b border-primary/30 bg-primary-soft px-4 py-2 text-center text-sm">Modalita di prova: i pagamenti nell'anteprima non sono reali.</div>;
  }
  return null;
}
