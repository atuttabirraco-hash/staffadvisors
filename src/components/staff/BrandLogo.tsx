type BrandLogoProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function BrandLogo({ compact = false, inverted = false }: BrandLogoProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5" dir="ltr">
      <img
        src="/icon-192.png"
        alt=""
        width={192}
        height={192}
        className={compact ? "h-10 w-10 shrink-0" : "h-11 w-11 shrink-0 sm:h-12 sm:w-12"}
      />
      <span className={`font-extrabold tracking-normal ${compact ? "text-lg" : "text-xl sm:text-2xl"} ${inverted ? "text-secondary-foreground" : "text-foreground"}`}>
        StaffAdvisors
      </span>
    </span>
  );
}