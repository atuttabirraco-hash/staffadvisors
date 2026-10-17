import { MailCheck } from "lucide-react";
import { useLang } from "@/lib/lang";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const { tr } = useLang();
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
      <MailCheck className="h-3 w-3" /> {tr.verifiedEmail} {"\u2705"}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      {tr.unverified}
    </span>
  );
}
