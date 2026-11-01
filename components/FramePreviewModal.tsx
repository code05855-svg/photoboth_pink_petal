"use client";

import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { FramePreview } from "./FramePreview";
import type { FrameDef } from "@/lib/frame-config";

interface Props {
  frame: FrameDef | null;
  selected: boolean;
  onClose: () => void;
  onChoose: (frame: FrameDef) => void;
}

/** Larger preview with real example photos, so you can see the frame properly before choosing it. */
export function FramePreviewModal({ frame, selected, onClose, onChoose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!frame) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [frame, onClose]);

  if (!frame) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-petal-plum/50 p-4 backdrop-blur-sm animate-rise"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={`${frame.name} preview`} className="card relative grid max-h-[94dvh] w-full max-w-3xl gap-6 overflow-y-auto p-5 sm:grid-cols-[minmax(0,260px)_1fr] sm:p-8">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-petal-mist text-petal hover:bg-petal-rose"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto w-full max-w-[260px]">
          <FramePreview frameId={frame.id} demo scale={0.5} className="shadow-soft" />
        </div>
        <div className="flex flex-col justify-center sm:pr-8">
          <p className="eyebrow">Frame preview</p>
          <h2 className="h-display mt-2 text-4xl">{frame.name}</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-petal-muted">{frame.description}</p>
          <p className="mt-2 text-[13px] text-petal-muted">Example photos shown. Yours will appear in the windows.</p>
          <button
            type="button"
            className="btn-primary mt-7 self-start"
            onClick={() => {
              onChoose(frame);
              onClose();
            }}
          >
            {selected ? (
              <>
                <Check className="h-4 w-4" /> Selected
              </>
            ) : (
              "Choose this frame"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
