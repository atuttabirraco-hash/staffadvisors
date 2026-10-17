import { Candy, Flower2, Gift, Sparkles, VenetianMask } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang";
import { getSeasonalContent, getSeasonalTheme, type SeasonalTheme } from "@/lib/seasonal";

const icons: Record<SeasonalTheme, typeof Sparkles> = {
  halloween: Candy,
  christmas: Gift,
  carnival: VenetianMask,
  easter: Flower2,
};

export function SeasonalDecorations() {
  const { lang } = useLang();
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);

  useEffect(() => {
    setTheme(getSeasonalTheme());
  }, []);

  if (!theme) return null;

  const content = getSeasonalContent(lang, theme);
  const Icon = icons[theme];

  return (
    <aside className={`seasonal seasonal-${theme}`} aria-label={content.label}>
      <div className="seasonal-mark" aria-hidden="true">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <p className="min-w-0 text-xs leading-snug sm:text-sm">
        <strong className="me-1.5 font-extrabold">{content.label}</strong>
        <span className="text-landing-paper/70">{content.message}</span>
      </p>
      <div className="seasonal-details" aria-hidden="true">
        <Sparkles className="seasonal-spark seasonal-spark-one" />
        <Sparkles className="seasonal-spark seasonal-spark-two" />
        {theme === "carnival" && <span className="seasonal-confetti seasonal-confetti-one" />}
        {theme === "carnival" && <span className="seasonal-confetti seasonal-confetti-two" />}
      </div>
    </aside>
  );
}