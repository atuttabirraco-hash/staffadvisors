import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { requestCompanyReply } from "@/lib/contact.functions";

export function ReplyRequestModal({ reviewId, companyId, companyName = "", onClose }: { reviewId: string | null; companyId: string; companyName?: string; onClose: () => void }) {
  const { tr } = useLang();
  const send = useServerFn(requestCompanyReply);
  const [f, setF] = useState({ name: "", role: "", email: "", phone: "", reply: "" });
  const [busy, setBusy] = useState(false);
  // Prefill the sender with the company name; the person replying can still change it.
  useEffect(() => {
    if (reviewId) setF((x) => (x.name ? x : { ...x, name: companyName }));
  }, [reviewId, companyName]);
  const input = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;
    setBusy(true);
    try {
      const res = await send({ data: { review_id: reviewId, company_id: companyId, ...f } });
      toast.success(res.awaitingConfirmation ? tr.replyPublished : tr.replySent);
      setF({ name: "", role: "", email: "", phone: "", reply: "" });
      onClose();
    } catch {
      toast.error(tr.errorGeneric);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!reviewId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr.replyFormTitle}</DialogTitle>
          <DialogDescription>{tr.replyFormDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-2">
          <input required minLength={2} maxLength={100} placeholder={tr.replyName} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} />
          <input maxLength={100} placeholder={tr.replyRole} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={input} />
          <input required type="email" maxLength={200} placeholder={tr.replyEmail} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} />
          <input type="tel" maxLength={40} placeholder={tr.replyPhone} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={input} />
          <textarea required minLength={10} maxLength={2000} rows={5} placeholder={tr.replyText} value={f.reply} onChange={(e) => setF({ ...f, reply: e.target.value })} className="w-full rounded-xl border border-border bg-card p-3 text-sm" />
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>{tr.replySend}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
