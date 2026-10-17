import type { ReactNode } from "react";
import { HomeLink } from "./HomeLink";
import { useLang } from "@/lib/lang";
import { Footer } from "./Sections";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { tr } = useLang();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <HomeLink className="text-sm font-semibold text-primary">{"\u2190"} {tr.backHome}</HomeLink>
        <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Ultimo aggiornamento: settembre 2026</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
