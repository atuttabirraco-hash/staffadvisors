import { SCORE_KEYS, EXTRA_SCORE_KEYS, type ScoreKey, type ExtraScoreKey } from "@/lib/constants";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

function Bar({ label, v, compact }: { label: string; v: number; compact: boolean }) {
  const { tr } = useLang();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={cn("shrink-0 truncate text-muted-foreground", compact ? "w-[4.5rem] text-[11px]" : "w-24 text-xs")}>
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", v >= 3.5 ? "bg-success" : v >= 2.5 ? "bg-primary" : "bg-destructive")}
          style={{ width: `${(v / 5) * 100}%` }}
        />
      </div>
      <span className={cn("w-6 text-right font-semibold tabular-nums", compact ? "text-[11px]" : "text-xs")}>
        {v ? v.toFixed(1) : tr.notApplicableShort}
      </span>
    </div>
  );
}

export function ScoreBars({
  scores,
  extraScores,
  compact = false,
}: {
  scores: Record<ScoreKey, number>;
  extraScores?: Record<ExtraScoreKey, number> | undefined;
  compact?: boolean;
}) {
  const { tr } = useLang();
  return (
    <div className={cn("grid min-w-0 gap-x-3 gap-y-2", compact ? "grid-cols-1 min-[360px]:grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
      {SCORE_KEYS.map((k) => (
        <Bar key={k} label={tr[k]} v={scores[k] ?? 0} compact={compact} />
      ))}
      {extraScores && EXTRA_SCORE_KEYS.map((k) => (
        <Bar key={k} label={tr[k]} v={extraScores[k] ?? 0} compact={compact} />
      ))}
    </div>
  );
}

export function ScorePill({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-card", cls)}>
      {value ? value.toFixed(1) : "N/D"}
    </div>
  );
}
