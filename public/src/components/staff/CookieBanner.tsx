import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";

export function CookieBanner() {
  const { tr } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(localStorage.getItem("sa_cookie_ok") !== "1");
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card-hover sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-muted-foreground">
        {tr.cookieBanner}{" "}
        <Link to="/cookie" className="font-semibold text-primary underline">{tr.cookies}</Link>
      </p>
      <Button variant="hero" size="sm" onClick={() => { localStorage.setItem("sa_cookie_ok", "1"); window.dispatchEvent(new Event("sa_cookie_ok")); setShow(false); }}>
        {tr.accept}
      </Button>
    </div>
  );
}
