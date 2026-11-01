"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Studio", href: "/camera/" },
  { label: "Frames", href: "/frames/" },
  { label: "About", href: "/#about" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="shell relative z-30 pt-6 sm:pt-8">
      <div className="flex items-center justify-between border-b border-petal-line pb-5">
        <Link href="/" className="flex items-center gap-2 text-petal" aria-label="Pink Petal home">
          <Heart className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="font-display text-[22px] font-bold italic uppercase tracking-wide sm:text-[24px]">Pink Petal</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-12 md:flex">
          {NAV.map((n) => {
            const active = n.href.startsWith("/#") ? false : pathname?.startsWith(n.href.replace(/\/$/, ""));
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-[12px] font-bold uppercase tracking-[0.04em] transition hover:text-petal",
                  active ? "text-petal" : "text-petal-muted",
                )}
              >
                {n.label}
              </Link>
            );
          })}
          <Link href="/frames/" className="btn-white shadow-soft !px-10">
            Get started
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/frames/" className="btn-white !px-5 !py-2.5 shadow-soft">
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-petal"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="card absolute inset-x-5 top-[calc(100%-4px)] flex flex-col p-3 shadow-soft sm:inset-x-8 md:hidden"
        >
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="rounded-2xl px-4 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-petal-muted hover:bg-petal-mist hover:text-petal"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
