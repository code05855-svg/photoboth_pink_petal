"use client";

import { useEffect, useRef, useState } from "react";
import { prepareComposition, renderComposition, type Composition, type PhotoSource } from "@/lib/canvas-renderer";
import { getFrame, type FrameId } from "@/lib/frame-config";
import { getLayout, type LayoutId } from "@/lib/layouts";
import { makeDemoPhotos } from "@/lib/photo-utils";
import { H, W } from "@/lib/draw-utils";
import { cn } from "@/lib/cn";

const cache = new Map<string, HTMLCanvasElement>();

interface Props {
  frameId: FrameId;
  layoutId?: LayoutId;
  /** Fill the windows with pretty example photos instead of "YOUR PHOTO" placeholders. */
  demo?: boolean;
  bg?: string;
  scale?: number;
  className?: string;
  label?: string;
}

/** A frame rendered by the very same Canvas code that produces the final download. */
export function FramePreview({ frameId, layoutId, demo = false, bg, scale = 0.4, className, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const frame = getFrame(frameId);
    const layout = layoutId ?? frame.layout;
    const color = bg ?? frame.defaultBg;
    const key = `${frameId}|${layout}|${color}|${demo}|${scale}`;

    const paint = (source: HTMLCanvasElement) => {
      const c = ref.current;
      if (!c || cancelled) return;
      c.width = source.width;
      c.height = source.height;
      c.getContext("2d")!.drawImage(source, 0, 0);
      setReady(true);
    };

    const hit = cache.get(key);
    if (hit) {
      paint(hit);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const count = getLayout(layout).count;
      const photos: (PhotoSource | null)[] = demo ? await makeDemoPhotos(count) : Array(count).fill(null);
      const comp: Composition = { frameId, layoutId: layout, bg: color, photos, items: [] };
      await prepareComposition(comp);
      if (cancelled) return;
      const out = renderComposition(comp, scale);
      cache.set(key, out);
      paint(out);
    })().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [frameId, layoutId, bg, demo, scale]);

  return (
    <canvas
      ref={ref}
      width={Math.round(W * scale)}
      height={Math.round(H * scale)}
      role="img"
      aria-label={label ?? `${getFrame(frameId).name} frame preview`}
      className={cn(
        "block h-auto w-full rounded-[18px] bg-petal-mist",
        !ready && "invisible",
        className,
      )}
      style={{ aspectRatio: `${W} / ${H}` }}
    />
  );
}
