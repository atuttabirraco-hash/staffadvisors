import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLang } from "@/lib/lang";

export function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete?: string }) {
  const { tr } = useLang();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        minLength={6}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 pe-11 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? tr.hidePassword : tr.showPassword}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
