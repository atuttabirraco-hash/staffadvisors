import { useEffect, useState } from "react";
import { X, Share, MoreVertical, Download } from "lucide-react";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "sa_install_dismissed";
const DISMISS_DAYS = 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || (ua.includes("macintosh") && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

// Only show the install banner once the cookie notice has been accepted:
// both are fixed to the bottom edge and would otherwise overlap.
function eligiblePlatform(): "ios" | "android" | null {
  if (localStorage.getItem("sa_cookie_ok") !== "1") return null;
  if (isStandalone()) return null;
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return null;
  const detected = detectPlatform();
  return detected === "other" ? null : detected;
}

export function InstallPrompt() {
  const { tr } = useLang();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const evaluate = () => {
      const detected = eligiblePlatform();
      if (!detected) return;
      setPlatform(detected);
      setVisible(true);
    };
    evaluate();
    window.addEventListener("sa_cookie_ok", evaluate);
    window.addEventListener("storage", evaluate);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("sa_cookie_ok", evaluate);
      window.removeEventListener("storage", evaluate);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setModalOpen(false);
  };

  const onAdd = () => {
    // Android with a native prompt available: install straight away,
    // instructions are only the fallback (e.g. Samsung Internet).
    if (platform === "android" && deferredPrompt) {
      void installOnAndroid();
      return;
    }
    setModalOpen(true);
  };

  const installOnAndroid = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        setVisible(false);
        setModalOpen(false);
      }
    } catch {
      setDeferredPrompt(null);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl bg-[#0F172A] p-4 text-white shadow-card-hover">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">{tr.installTitle}</p>
            <p className="mt-0.5 text-xs text-white/70">{tr.installSub}</p>
          </div>
          <Button variant="hero" size="sm" onClick={onAdd} className="shrink-0">
            {tr.installAdd}
          </Button>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={dismiss}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-5 text-card-foreground shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg" />
                <p className="font-bold">{tr.installTitle}</p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                onClick={() => setPlatform("ios")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${platform === "ios" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {tr.installIos}
              </button>
              <button
                onClick={() => setPlatform("android")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${platform === "android" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {tr.installAndroid}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-border p-4">
              {platform === "ios" ? (
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              ) : (
                <MoreVertical className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {platform === "ios" ? tr.installIosSteps : tr.installAndroidSteps}
              </p>
            </div>

            {platform === "android" && deferredPrompt && (
              <Button
                variant="hero"
                className="mt-4 w-full"
                onClick={() => void installOnAndroid()}
              >
                <Download className="h-4 w-4" /> {tr.installAdd}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
