import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminSurveys } from "@/lib/admin.functions";

type D = Awaited<ReturnType<typeof adminSurveys>>;

export function AdminSurveys({ password }: { password: string }) {
  const fn = useServerFn(adminSurveys);
  const [d, setD] = useState<D | null>(null);
  useEffect(() => { void fn({ data: { password } }).then(setD).catch(() => setD(null)); }, [password]);
  if (!d) return null;
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 text-lg font-bold">Area aziende: account e sondaggi ({d.companies.length} aziende, {d.surveys.length} sondaggi)</h2>
      {d.companies.map((c) => (
        <div key={c.user_id} className="mb-4 rounded-xl border border-border p-3">
          <p className="font-semibold">{c.company_name} <span className="text-xs text-muted-foreground">· iscritta il {new Date(c.created_at).toLocaleDateString("it-IT")}</span></p>
          {d.surveys.filter((s) => s.owner_id === c.user_id).map((s) => {
            const n = d.responses.filter((r) => r.survey_id === s.id).length;
            return (
              <div key={s.id} className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{s.title} · {n} risposte · {s.is_active ? "Attivo" : "In pausa"}</p>
                {d.questions.filter((q) => q.survey_id === s.id).map((q) => (
                  <div key={q.id} className="mt-1">
                    <p className="text-xs font-semibold">{q.text}</p>
                    <p className="text-xs text-muted-foreground">{q.options.map((o, i) => `${o}: ${d.answers.filter((a) => a.question_id === q.id && a.option_index === i).length}`).join(" · ")}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
