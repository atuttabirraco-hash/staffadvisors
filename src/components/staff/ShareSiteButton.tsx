import { useEffect, useRef, useState } from "react";
import { Check, Copy, Facebook, Linkedin, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";

const item =
  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-muted";

// Share button for the homepage hero: on phones it opens the native share sheet
// (WhatsApp, Messages, AirDrop...), on desktop it opens a small menu of links.
export function ShareSiteButton() {
  const { tr } = useLang();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const url = SITE_URL;
  const text = `${tr.shareSiteText}\n${url}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    setOpen(false);
    toast.success(tr.shareCopied);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const onClick = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "StaffAdvisors", text: tr.shareSiteText, url });
        return;
      } catch {
        // The visitor closed the share sheet: fall back to the menu below.
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => void onClick()}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/25 bg-secondary-foreground/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary-foreground/20 sm:text-sm"
      >
        <Share2 className="h-4 w-4" />
        {tr.shareSite}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-card"
        >
          <a
            role="menuitem"
            className={item}
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
          </a>
          <a
            role="menuitem"
            className={item}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-4 w-4 text-muted-foreground" /> Facebook
          </a>
          <a
            role="menuitem"
            className={item}
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4 text-muted-foreground" /> LinkedIn
          </a>
          <a
            role="menuitem"
            className={item}
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(tr.shareSiteText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send className="h-4 w-4 text-muted-foreground" /> Telegram
          </a>
          <button type="button" role="menuitem" className={item} onClick={() => void copy()}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            {copied ? tr.shareCopied : tr.shareCopy}
          </button>
        </div>
      )}
    </div>
  );
}
