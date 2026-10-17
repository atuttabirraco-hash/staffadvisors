import { useState } from "react";
import { Check, Copy, Facebook, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/lang";

const base =
  "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const { tr } = useLang();
  const [copied, setCopied] = useState(false);
  const text = `${title}\n${url}`;

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{tr.shareTitle}</span>
      <a className={base} href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <MessageCircle className="h-3.5 w-3.5" />
        WhatsApp
      </a>
      <a className={base} href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <Facebook className="h-3.5 w-3.5" />
        Facebook
      </a>
      <button type="button" className={base} onClick={copy} aria-label={copied ? tr.shareCopied : tr.shareCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? tr.shareCopied : tr.shareCopy}
      </button>
    </div>
  );
}
