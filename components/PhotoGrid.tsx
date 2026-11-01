"use client";

import { Camera, RotateCcw } from "lucide-react";
import type { CapturedPhoto } from "@/lib/photo-utils";
import { cn } from "@/lib/cn";

interface Props {
  photos: (CapturedPhoto | null)[];
  busy: boolean;
  activeIndex: number | null;
  onRetake: (index: number) => void;
}

/** One tile per shot: empty until taken, then a thumbnail with a Retake button. */
export function PhotoGrid({ photos, busy, activeIndex, onRetake }: Props) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-5" aria-label="Your shots">
      {photos.map((p, i) => (
        <li key={i} className="min-w-0">
          <div
            className={cn(
              "relative aspect-[4/5] overflow-hidden rounded-2xl border-2 bg-white",
              activeIndex === i ? "border-petal" : p ? "border-petal-line" : "border-dashed border-petal-line",
            )}
          >
            {p ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt={`Shot ${i + 1}`} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-petal-muted">
                <div className="text-center">
                  <Camera className="mx-auto h-5 w-5 opacity-60" />
                  <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.05em]">{activeIndex === i ? "Smile!" : "Waiting"}</span>
                </div>
              </div>
            )}
            <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[11px] font-bold text-petal shadow-sm">
              {i + 1}
            </span>
          </div>
          <button
            type="button"
            disabled={busy || !p}
            onClick={() => onRetake(i)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-petal transition hover:bg-petal-rose/60 disabled:pointer-events-none disabled:opacity-35"
            aria-label={`Retake shot ${i + 1}`}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake
          </button>
        </li>
      ))}
    </ul>
  );
}
