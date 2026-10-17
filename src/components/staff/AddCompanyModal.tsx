import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { REGIONS, SECTORS } from "@/lib/constants";
import { createCompany } from "@/lib/staff.functions";
import type { Company } from "@/lib/company-data";

export const fieldCls =
  "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

export function AddCompanyModal({
  open,
  initialName = "",
  onClose,
  onCreated,
}: {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (c: Company) => void;
}) {
  const { tr } = useLang();
  const create = useServerFn(createCompany);
  const [form, setForm] = useState({ name: initialName, legal_name: "", vat: "", city: "", address: "", cap: "", region: "", sector: "", country: "Italy" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error(tr.requiredFields);
      return;
    }
    setBusy(true);
    try {
      const row = await create({ data: form });
      if (row.duplicate) toast.info(tr.branchExists); else toast.success(tr.companyCreated);
      onCreated(row);
    } catch {
      toast.error(tr.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg rounded-2xl sm:w-full">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-extrabold">{tr.addCompany}</DialogTitle>
          <DialogDescription>{tr.companyNotFound}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>{tr.name} *</label>
            <input className={fieldCls} value={form.name} onChange={set("name")} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{tr.legalName}</label>
            <input className={fieldCls} value={form.legal_name} onChange={set("legal_name")} />
          </div>
          <div>
            <label className={labelCls}>{tr.vat}</label>
            <input className={fieldCls} value={form.vat} onChange={set("vat")} />
          </div>
          <div>
            <label className={labelCls}>{tr.city}</label>
            <input className={fieldCls} value={form.city} onChange={set("city")} />
          </div>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_7rem]">
            <div>
              <label className={labelCls}>{tr.address}</label>
              <input className={fieldCls} value={form.address} onChange={set("address")} placeholder="Via Roma 1" />
            </div>
            <div>
              <label className={labelCls}>{tr.cap}</label>
              <input className={fieldCls} value={form.cap} onChange={set("cap")} inputMode="numeric" maxLength={5} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{tr.region}</label>
            <select className={fieldCls} value={form.region} onChange={set("region")}>
              <option value="">{tr.selectPlaceholder}</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{tr.sector}</label>
            <select className={fieldCls} value={form.sector} onChange={set("sector")}>
              <option value="">{tr.selectPlaceholder}</option>
              {SECTORS.map((s) => <option key={s} value={s}>{tr.sectors[s]}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{tr.country}</label>
            <input className={fieldCls} value={form.country} onChange={set("country")} />
          </div>
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>{tr.cancel}</Button>
            <Button type="submit" variant="hero" disabled={busy}>{tr.createCompany}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
