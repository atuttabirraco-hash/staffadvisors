import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useBranches, useCompanySearch } from "@/lib/company-query";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Check, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useLang } from "@/lib/lang";
import { MEAL_FREQ, MEAL_VALUES, MEAL_PROVIDERS, WELFARE_ANSWERS, WELFARE_ITEMS, CONTRACT_TYPES, REGIONS, SCORE_KEYS, SECTORS, EXTRA_SCORE_KEYS, isHospitality, type ContractType, type ScoreKey, type ExtraScoreKey } from "@/lib/constants";
import { submitReview, submitReviewGuest } from "@/lib/staff.functions";
import { getSiteSettings } from "@/lib/public.functions";
import { useQuery } from "@tanstack/react-query";
import { contractLabel, type Company } from "@/lib/company-data";
import { fieldCls, labelCls } from "./AddCompanyModal";
import { supabase } from "@/integrations/supabase/client";
import { reviewAccessCopy } from "@/lib/review-access-copy";

export function WriteReviewModal({
  open,
  preselected,
  onClose,
  onCreateCompany,
  onSubmitted,
}: {
  open: boolean;
  preselected: Company | null;
  onClose: () => void;
  onCreateCompany: (name: string) => void;
  onSubmitted: () => void;
}) {
  const { tr, lang } = useLang();
  const submitAuth = useServerFn(submitReview);
  const submitGuest = useServerFn(submitReviewGuest);
  const fetchSettings = useServerFn(getSiteSettings);
  const settingsQ = useQuery({ queryKey: ["site-settings-reviews"], queryFn: () => fetchSettings() });
  const loginRequired = settingsQ.data?.reviews_require_login ?? true;
  const [company, setCompany] = useState<Company | null>(preselected);
  const [q, setQ] = useState(preselected?.name ?? "");
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ salary: 3, shifts: 3, management: 3, growth: 3, safety: 3, environment: 3 });
  const [extraScores, setExtraScores] = useState<Record<ExtraScoreKey, number>>({ tips: 0, notice: 0, mealLodging: 0, overtime: 0 });
  const [form, setForm] = useState({
    region: preselected?.region ?? "",
    city: preselected?.city ?? "",
    sector: preselected?.sector ?? "",
    role: "",
    contract_type: "" as ContractType | "",
    pro: "",
    cons: "",
    advice: "",
    is_anonymous: true,
    worked_here: false,
    meal_frequency: "" as (typeof MEAL_FREQ)[number] | "",
    meal_value: "" as (typeof MEAL_VALUES)[number] | "",
    meal_provider: "" as (typeof MEAL_PROVIDERS)[number] | "",
    welfare_answer: "" as (typeof WELFARE_ANSWERS)[number] | "",
    welfare_items: [] as (typeof WELFARE_ITEMS)[number][],
  });
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [branchOk, setBranchOk] = useState(!!preselected);
  const branches = useBranches(company?.parent_brand, company?.city);
  const multi = (branches.data?.length ?? 0) > 1;

  const search = useCompanySearch(company ? "" : q);
  const matches: Company[] = company || q.trim().length < 2 ? [] : (search.data ?? []).slice(0, 6);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) setSignedIn(!!data.user); });
    return () => { active = false; };
  }, []);

  const pick = (c: Company) => {
    setCompany(c);
    setBranchOk(false);
    setQ(c.name);
    setForm((f) => ({ ...f, region: c.region ?? f.region, city: c.city ?? f.city, sector: c.sector ?? f.sector }));
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error(tr.selectCompany);
      return;
    }
    if (multi && !branchOk) {
      toast.error(tr.whichBranch);
      return;
    }
    if (!form.role || !form.contract_type || form.pro.length < 5 || form.cons.length < 5 || !form.worked_here) {
      toast.error(tr.requiredFields);
      return;
    }
    if (!form.meal_frequency || !form.welfare_answer) {
      toast.error(tr.benefitsRequired);
      return;
    }
    setBusy(true);
    try {
      const deviceId = (() => { let d = localStorage.getItem("sa_device"); if (!d) { d = crypto.randomUUID(); localStorage.setItem("sa_device", d); } return d; })();
      const payload = {
          company_id: company.id,
          role: form.role,
          sector: form.sector || null,
          contract_type: form.contract_type,
          score_salary: scores.salary,
          score_shifts: scores.shifts,
          score_management: scores.management,
          score_growth: scores.growth,
          score_safety: scores.safety,
          score_environment: scores.environment,
          score_tips: extraScores.tips,
          score_notice: extraScores.notice,
          score_meal_lodging: extraScores.mealLodging,
          score_overtime: extraScores.overtime,
          pro: form.pro,
          cons: form.cons,
          advice: form.advice || null,
          is_anonymous: form.is_anonymous,
          worked_here: form.worked_here,
          meal_frequency: form.meal_frequency,
          meal_value: form.meal_value || null,
          meal_provider: form.meal_provider || null,
          welfare_answer: form.welfare_answer,
          welfare_items: form.welfare_items,
          lang,
        };
      const res = signedIn ? await submitAuth({ data: payload }) : await submitGuest({ data: { ...payload, device_id: deviceId } });
      if (res.status === "rejected") {
        toast.error(tr.reviewBlocked);
      } else if (res.status === "limit") {
        toast.error(tr.limitReached);
      } else {
        toast.success(tr.reviewSubmitted);
        onSubmitted();
      }
    } catch {
      toast.error(tr.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (signedIn === null || (signedIn === false && (loginRequired || settingsQ.isLoading))) {
    const access = reviewAccessCopy[lang];
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle>{access.title}</DialogTitle>
            <DialogDescription>{access.text}</DialogDescription>
          </DialogHeader>
          {signedIn === false && <div className="mt-3 grid gap-2 sm:grid-cols-2"><Button asChild variant="outline"><Link to="/accedi">{tr.signIn}</Link></Button><Button asChild variant="hero"><Link to="/registrati">{tr.signUp}</Link></Button></div>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl sm:w-full">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-extrabold">{tr.writeReview}</DialogTitle>
          <DialogDescription>{tr.mission}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="relative">
            <label className={labelCls}>{tr.searchCompany} *</label>
            <input
              className={fieldCls}
              value={q}
              onChange={(e) => { setQ(e.target.value); setCompany(null); }}
              placeholder={tr.searchCompany}
            />
            {company && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                <Check className="h-3 w-3" /> {company.name} {company.legal_name ? `(${company.legal_name})` : ""}
              </span>
            )}
            {!company && q.trim().length > 1 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-card-hover">
                {matches.map((c) => (
                  <button type="button" key={c.id} onClick={() => pick(c)} className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.full_address ?? c.city}</span>
                  </button>
                ))}
                <button type="button" onClick={() => onCreateCompany(q)} className="w-full px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary-soft">
                  + {tr.companyNotFound}
                </button>
              </div>
            )}
          </div>

          {company && multi && (
            <div className="rounded-xl border border-primary/40 bg-primary-soft p-3">
              <label className={labelCls}>{tr.whichBranch} *</label>
              <select
                className={fieldCls}
                value={branchOk ? company.id : ""}
                onChange={(e) => {
                  if (e.target.value === "__new") { onCreateCompany(company.parent_brand ?? company.name); return; }
                  const b = branches.data?.find((x) => x.id === e.target.value);
                  if (b) { setCompany({ ...company, ...b }); setBranchOk(true); }
                }}
              >
                <option value="">{tr.selectPlaceholder}</option>
                {branches.data?.map((b) => <option key={b.id} value={b.id}>{b.full_address ?? b.name}</option>)}
                <option value="__new">+ {tr.addBranch}</option>
              </select>
            </div>
          )}

          {/* Region/city/sector come from the selected company; ask only when none is picked yet. */}
          {!company && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>{tr.region}</label>
                <select className={fieldCls} value={form.region} onChange={set("region")}>
                  <option value="">{tr.selectPlaceholder}</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tr.city}</label>
                <input className={fieldCls} value={form.city} onChange={set("city")} />
              </div>
              <div>
                <label className={labelCls}>{tr.sector}</label>
                <select className={fieldCls} value={form.sector} onChange={set("sector")}>
                  <option value="">{tr.selectPlaceholder}</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{tr.sectors[s]}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{tr.role} *</label>
              <input className={fieldCls} value={form.role} onChange={set("role")} required />
            </div>
            <div>
              <label className={labelCls}>{tr.contractType} *</label>
              <select className={fieldCls} value={form.contract_type} onChange={set("contract_type")} required>
                <option value="">{tr.selectPlaceholder}</option>
                {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{contractLabel(c, tr)}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="mb-3 text-sm font-bold">{tr.yourScores}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SCORE_KEYS.map((k) => (
                <div key={k}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-semibold">{tr[k]}</span>
                    <span className="font-bold text-primary">{scores[k]}/5</span>
                  </div>
                  <Slider min={1} max={5} step={1} value={[scores[k]]} onValueChange={([v]) => setScores((s) => ({ ...s, [k]: v ?? 3 }))} />
                </div>
              ))}
            </div>
            {(isHospitality(company?.sector) || isHospitality(form.sector)) && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{"\ud83c\udf7d\ufe0f"} {tr.hospitalityScores}</p>
                <p className="mb-3 text-[11px] text-muted-foreground">{tr.hospitalityScoresHint}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {EXTRA_SCORE_KEYS.map((k) => (
                    <div key={k}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-semibold">{tr[k]}</span>
                        <span className="font-bold text-primary">{extraScores[k] === 0 ? tr.notApplicableShort : `${extraScores[k]}/5`}</span>
                      </div>
                      <Slider min={0} max={5} step={1} value={[extraScores[k]]} onValueChange={([v]) => setExtraScores((s) => ({ ...s, [k]: v ?? 0 }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div>
              <label className={labelCls}>{tr.pro} *</label>
              <textarea className={`${fieldCls} h-20 py-2`} value={form.pro} onChange={set("pro")} required />
            </div>
            <div>
              <label className={labelCls}>{tr.cons} *</label>
              <textarea className={`${fieldCls} h-20 py-2`} value={form.cons} onChange={set("cons")} required />
            </div>
            <div>
              <label className={labelCls}>{tr.advice}</label>
              <textarea className={`${fieldCls} h-16 py-2`} value={form.advice} onChange={set("advice")} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-4 text-sm">
            <div>
              <p className="mb-2 font-semibold">{"\ud83c\udfab"} {tr.mealQ} *</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_FREQ.map((v) => (
                  <Chip key={v} on={form.meal_frequency === v} onClick={() => setForm((f) => ({ ...f, meal_frequency: v }))}>
                    {{ daily: tr.mealDaily, some: tr.mealSome, no: tr.answerNo, unknown: tr.dontKnow }[v]}
                  </Chip>
                ))}
              </div>
              {(form.meal_frequency === "daily" || form.meal_frequency === "some") && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className={labelCls}>{tr.mealValue}</p>
                    <div className="flex flex-wrap gap-2">{MEAL_VALUES.map((v) => <Chip key={v} on={form.meal_value === v} onClick={() => setForm((f) => ({ ...f, meal_value: v }))}>{"\u20ac"}{v}</Chip>)}</div>
                  </div>
                  <div>
                    <p className={labelCls}>{tr.mealProvider}</p>
                    <div className="flex flex-wrap gap-2">{MEAL_PROVIDERS.map((v) => <Chip key={v} on={form.meal_provider === v} onClick={() => setForm((f) => ({ ...f, meal_provider: v }))}>{v}</Chip>)}</div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 font-semibold">{"\u2764\ufe0f"} {tr.welfareQ} *</p>
              <div className="flex flex-wrap gap-2">
                {WELFARE_ANSWERS.map((v) => (
                  <Chip key={v} on={form.welfare_answer === v} onClick={() => setForm((f) => ({ ...f, welfare_answer: v }))}>
                    {{ yes: tr.answerYes, no: tr.answerNo, unknown: tr.dontKnow }[v]}
                  </Chip>
                ))}
              </div>
              {form.welfare_answer === "yes" && (
                <div className="mt-3">
                  <p className={labelCls}>{tr.welfareWhich}</p>
                  <div className="flex flex-wrap gap-2">
                    {WELFARE_ITEMS.map((v) => (
                      <Chip key={v} on={form.welfare_items.includes(v)} onClick={() => setForm((f) => ({ ...f, welfare_items: f.welfare_items.includes(v) ? f.welfare_items.filter((x) => x !== v) : [...f.welfare_items, v] }))}>
                        {tr.wf[v]}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={form.is_anonymous} onCheckedChange={(v) => setForm((f) => ({ ...f, is_anonymous: v === true }))} />
              {tr.anonymousLabel}
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={form.worked_here} onCheckedChange={(v) => setForm((f) => ({ ...f, worked_here: v === true }))} />
              {tr.workedHere} *
            </label>
            <p className="flex items-center gap-2 rounded-xl bg-primary-soft p-3 text-sm font-semibold"><Lock className="h-4 w-4 text-primary" /> {tr.trustBox}</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>{tr.cancel}</Button>
            <Button type="submit" variant="hero" disabled={busy}>{tr.submit}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>
      {children}
    </button>
  );
}
