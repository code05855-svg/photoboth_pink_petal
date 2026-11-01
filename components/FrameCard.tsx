"use client";

import { Eye } from "lucide-react";
import { FramePreview } from "./FramePreview";
import type { FrameDef } from "@/lib/frame-config";
import { cn } from "@/lib/cn";

interface Props {
  frame: FrameDef;
  selected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  /** Label for the unselected state. */
  chooseLabel?: string;
}

export function FrameCard({ frame, selected, onSelect, onPreview, chooseLabel = "Choose" }: Props) {
  return (
    <article
      className={cn(
        "card flex flex-col items-center p-4 text-center transition duration-300 sm:p-5 xl:p-3.5",
        selected ? "border-petal shadow-soft ring-2 ring-petal" : "hover:-translate-y-1 hover:shadow-soft",
      )}
    >
      <div className="relative w-full max-w-[210px]">
        <FramePreview frameId={frame.id} scale={0.4} className="shadow-[0_14px_30px_-18px_rgba(216,27,96,0.45)]" />
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            aria-label={`Preview ${frame.name} larger`}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-petal shadow-soft transition hover:scale-105"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      <div className="mt-5 flex flex-1 flex-col items-center">
        <h3 className="h-display text-[22px] font-bold sm:text-[24px] xl:text-[18px]">{frame.name}</h3>
        <p className="mt-1 text-[13px] text-petal-muted">{frame.tagline}</p>
      </div>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn("mt-5 w-full max-w-[200px] xl:!px-4", selected ? "btn-primary" : "btn-soft")}
      >
        {selected ? "Selected" : chooseLabel}
      </button>
    </article>
  );
}
