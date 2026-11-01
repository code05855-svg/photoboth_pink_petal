import type { ReactNode } from "react";

export function StepHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="pt-8 sm:pt-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h-display mt-3 text-[clamp(2.4rem,5.6vw,4rem)]">{title}</h1>
      {children && <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-petal-muted">{children}</p>}
    </div>
  );
}
