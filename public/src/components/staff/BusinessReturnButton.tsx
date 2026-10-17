import { Link, useRouterState } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useHomeNavigation } from "./HomeLink";
import { useLang } from "@/lib/lang";
import { businessCopy } from "@/lib/business-copy";
import { Button } from "@/components/ui/button";

/**
 * Navigation action shown only to signed-in business accounts while they browse
 * public pages: brings them back to their private business area.
 */
export function BusinessReturnButton() {
  const { business, loading } = useHomeNavigation();
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (loading || !business || pathname === "/area-aziende") return null;
  const bc = businessCopy[lang];
  return (
    <Button asChild variant="hero" size="sm" className="h-auto min-h-10 max-w-full rounded-xl px-3 py-2 text-sm">
    <Link
      to="/area-aziende"
      aria-label={bc.backToArea}
    >
      <Building2 className="h-4 w-4 shrink-0" />
      <span className="whitespace-normal">{bc.areaTitle}</span>
    </Link>
    </Button>
  );
}
