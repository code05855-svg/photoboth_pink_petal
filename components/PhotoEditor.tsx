"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Loader2, RotateCcw } from "lucide-react";
import { useSession } from "./SessionProvider";
import { FramePreview } from "./FramePreview";
import { SelectionBar, StickerPicker, TextControls } from "./DecorationPanel";
import {
  HANDLE_R,
  handlePositions,
  hitTest,
  neededStickers,
  paintPreview,
  prepareComposition,
  renderBase,
  type Composition,
  type PhotoSource,
} from "@/lib/canvas-renderer";
import { FRAMES, getFrame } from "@/lib/frame-config";
import { LAYOUTS, type LayoutId } from "@/lib/layouts";
import { stickersReady } from "@/lib/sticker-render";
import { toPhotoSource } from "@/lib/photo-utils";
import { clamp, H, W } from "@/lib/draw-utils";
import { cn } from "@/lib/cn";

const PREVIEW_SCALE = 0.7;
type Tab = "frame" | "stickers" | "text" | "photos";
const TABS: { id: Tab; label: string }[] = [
  { id: "frame", label: "Frame" },
  { id: "stickers", label: "Stickers" },
  { id: "text", label: "Text" },
  { id: "photos", label: "Photos" },
];

export function EmptyPhotos({ message = "Take your photos first and they'll show up here." }: { message?: string }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-petal-rose text-petal">
        <Camera className="h-6 w-6" />
      </span>
      <h2 className="h-display mt-5 text-3xl">No photos yet</h2>
      <p className="mt-2 text-[15px] text-petal-muted">{message}</p>
      <Link href="/camera/" className="btn-primary mt-6">
        Go to camera <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function PhotoEditor() {
  const { hasAllPhotos } = useSession();
  if (!hasAllPhotos) return <EmptyPhotos />;
  return <EditorInner />;
}

function LayoutIcon({ id }: { id: LayoutId }) {
  const r = (x: number, y: number, w: number, h: number) => <rect key={`${x}${y}`} x={x} y={y} width={w} height={h} rx="2" fill="currentColor" opacity=".85" />;
  const shapes: Record<LayoutId, React.ReactNode[]> = {
    duo: [r(4, 3, 28, 15), r(4, 22, 28, 15)],
    trio: [r(6, 2, 24, 10), r(6, 15, 24, 10), r(6, 28, 24, 10)],
    strip: [r(8, 1.5, 20, 7.5), r(8, 11.5, 20, 7.5), r(8, 21.5, 20, 7.5), r(8, 31.5, 20, 7.5)],
    grid: [r(4, 4, 13, 14), r(19, 4, 13, 14), r(4, 22, 13, 14), r(19, 22, 13, 14)],
  };
  return (
    <svg viewBox="0 0 36 40" className="h-10 w-9" aria-hidden>
      {shapes[id]}
    </svg>
  );
}

function EditorInner() {
  const s = useSession();
  const frame = getFrame(s.frameId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const baseKey = useRef("");
  const fontsReady = useRef(false);

  const [tab, setTab] = useState<Tab>("frame");
  const [ready, setReady] = useState(false);
  const [sources, setSources] = useState<Record<string, PhotoSource>>({});
  const [draft, setDraft] = useState("");
  const [textColor, setTextColor] = useState("#B3154E");
  const [textSize, setTextSize] = useState(76);

  const { seedCaption, captionSeeded } = s;
  useEffect(() => {
    if (!captionSeeded) seedCaption();
  }, [captionSeeded, seedCaption]);

  // Decode the captured photos once so every re-render is instant.
  useEffect(() => {
    let off = false;
    s.activePhotos.forEach((p) => {
      if (p && !sources[p.id])
        toPhotoSource(p)
          .then((src) => !off && setSources((cur) => (cur[p.id] ? cur : { ...cur, [p.id]: src })))
          .catch(() => undefined);
    });
    return () => {
      off = true;
    };
  }, [s.activePhotos, sources]);

  const slotPhotos = useMemo(
    () => s.slotMap.map((pi) => (s.activePhotos[pi] ? (sources[s.activePhotos[pi]!.id] ?? null) : null)),
    [s.slotMap, s.activePhotos, sources],
  );

  const comp = useMemo<Composition>(
    () => ({ frameId: s.frameId, layoutId: s.layoutId, bg: s.bg, photos: slotPhotos, items: s.items }),
    [s.frameId, s.layoutId, s.bg, slotPhotos, s.items],
  );

  // Live preview: the base layer (frame + photos) is cached; only stickers/text repaint while dragging.
  useEffect(() => {
    let off = false;
    const key = [comp.frameId, comp.layoutId, comp.bg, s.slotMap.map((pi, slot) => `${s.activePhotos[pi]?.id ?? "-"}${slotPhotos[slot] ? "+" : "."}`).join(",")].join("|");
    const paint = () => {
      const canvas = canvasRef.current;
      if (!canvas || off) return;
      if (!baseRef.current || baseKey.current !== key) {
        baseRef.current = renderBase(comp, PREVIEW_SCALE);
        baseKey.current = key;
      }
      paintPreview(canvas, baseRef.current, comp, s.selectedId);
      setReady(true);
    };
    if (fontsReady.current && stickersReady(neededStickers(comp))) paint();
    else
      prepareComposition(comp)
        .then(() => {
          fontsReady.current = true;
          paint();
        })
        .catch(() => undefined);
    return () => {
      off = true;
    };
  }, [comp, s.selectedId, s.slotMap, s.activePhotos, slotPhotos]);

  /* ------------------------------------------------ canvas interaction */

  type Drag =
    | { mode: "move"; id: string; px: number; py: number; ox: number; oy: number }
    | { mode: "resize"; id: string; cx: number; cy: number; d0: number; a0: number; size0: number; rot0: number };
  const drag = useRef<Drag | null>(null);
  const itemsRef = useRef(s.items);
  itemsRef.current = s.items;

  const point = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const hitR = HANDLE_R * 2.1;

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = point(e);
    const items = itemsRef.current;
    const sel = items.find((i) => i.id === s.selectedId);
    if (sel) {
      const h = handlePositions(sel);
      if (Math.hypot(p.x - h.remove.x, p.y - h.remove.y) < hitR) {
        s.removeItem(sel.id);
        return;
      }
      if (Math.hypot(p.x - h.resize.x, p.y - h.resize.y) < hitR) {
        drag.current = {
          mode: "resize",
          id: sel.id,
          cx: sel.x,
          cy: sel.y,
          d0: Math.max(10, Math.hypot(p.x - sel.x, p.y - sel.y)),
          a0: Math.atan2(p.y - sel.y, p.x - sel.x),
          size0: sel.size,
          rot0: sel.rotation,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
    const hit = hitTest(items, p.x, p.y);
    if (hit) {
      s.setSelectedId(hit.id);
      drag.current = { mode: "move", id: hit.id, px: p.x, py: p.y, ox: hit.x, oy: hit.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else s.setSelectedId(null);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = point(e);
    if (d.mode === "move") {
      s.updateItem(d.id, { x: clamp(d.ox + p.x - d.px, 0, W), y: clamp(d.oy + p.y - d.py, 0, H) });
    } else {
      const it = itemsRef.current.find((i) => i.id === d.id);
      if (!it) return;
      const dist = Math.hypot(p.x - d.cx, p.y - d.cy);
      const ang = Math.atan2(p.y - d.cy, p.x - d.cx);
      const [lo, hi] = it.kind === "text" ? [28, 200] : [80, 720];
      s.updateItem(d.id, { size: clamp((d.size0 * dist) / d.d0, lo, hi), rotation: d.rot0 + ((ang - d.a0) * 180) / Math.PI });
    }
  };

  const onUp = () => {
    drag.current = null;
  };

  const selected = s.items.find((i) => i.id === s.selectedId) ?? null;

  const onKey = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const step = e.shiftKey ? 30 : 8;
    const move = (dx: number, dy: number) => {
      e.preventDefault();
      s.updateItem(selected.id, { x: clamp(selected.x + dx, 0, W), y: clamp(selected.y + dy, 0, H) });
    };
    if (e.key === "ArrowLeft") move(-step, 0);
    else if (e.key === "ArrowRight") move(step, 0);
    else if (e.key === "ArrowUp") move(0, -step);
    else if (e.key === "ArrowDown") move(0, step);
    else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      s.removeItem(selected.id);
    } else if (e.key === "Escape") s.setSelectedId(null);
  };

  /* ------------------------------------------------ text tab wiring */

  const selectedId = selected?.id;
  useEffect(() => {
    if (selected?.kind === "text") {
      setDraft(selected.text ?? "");
      setTextColor(selected.color ?? "#33252C");
      setTextSize(selected.size);
    }
    // only when the selection itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const editingText = selected?.kind === "text";
  const onDraft = (v: string) => {
    setDraft(v);
    if (editingText && selected) s.updateItem(selected.id, { text: v });
  };
  const onColor = (c: string) => {
    setTextColor(c);
    if (editingText && selected) s.updateItem(selected.id, { color: c });
  };
  const onSize = (n: number) => {
    setTextSize(n);
    if (editingText && selected) s.updateItem(selected.id, { size: n });
  };
  const addText = () => {
    if (draft.trim()) s.addText(draft.trim(), textColor, textSize);
  };

  const addSticker = useCallback(
    (id: string) => {
      s.addSticker(id);
    },
    [s],
  );

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
      {/* ------------------------------------------------ live preview */}
      <section className="card p-4 sm:p-6" aria-label="Live preview">
        <div
          className="relative mx-auto overflow-hidden rounded-[18px] bg-petal-mist shadow-[0_20px_44px_-24px_rgba(216,27,96,0.5)]"
          style={{ width: "min(100%, calc(70vh * 0.5625))", aspectRatio: `${W} / ${H}` }}
          data-selection={
            selected
              ? JSON.stringify({
                  cx: selected.x / W,
                  cy: selected.y / H,
                  resize: [handlePositions(selected).resize.x / W, handlePositions(selected).resize.y / H],
                  remove: [handlePositions(selected).remove.x / W, handlePositions(selected).remove.y / H],
                })
              : undefined
          }
        >
          <canvas
            ref={canvasRef}
            width={Math.round(W * PREVIEW_SCALE)}
            height={Math.round(H * PREVIEW_SCALE)}
            tabIndex={0}
            role="img"
            aria-label="Your photo strip. Tap a sticker or note to select it, then drag to move."
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
          />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center bg-petal-mist text-petal">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
        <div className="mt-4">
          <SelectionBar
            item={selected}
            onChange={(patch) => selected && s.updateItem(selected.id, patch)}
            onRemove={() => selected && s.removeItem(selected.id)}
            onFront={() => selected && s.bringToFront(selected.id)}
          />
        </div>
      </section>

      {/* ------------------------------------------------ controls */}
      <section className="card flex flex-col p-5 sm:p-8" aria-label="Decorate your strip">
        <h2 className="h-display text-[28px] font-bold sm:text-[32px]">Decorate your strip</h2>

        <div role="tablist" aria-label="Editor sections" className="mt-5 flex gap-1 rounded-full bg-petal-mist p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-full px-2 py-2.5 text-[12px] font-bold uppercase tracking-[0.04em] transition",
                tab === t.id ? "bg-petal text-white shadow-sm" : "text-petal hover:bg-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="thin-scroll mt-6 min-h-[300px] flex-1 overflow-y-auto pr-1 lg:max-h-[520px]">
          {tab === "frame" && (
            <div className="space-y-7">
              <div>
                <h3 className="field-label">Frames</h3>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
                  {FRAMES.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => s.setFrame(f.id)}
                        aria-pressed={f.id === s.frameId}
                        aria-label={f.name}
                        title={f.name}
                        className={cn(
                          "block w-full rounded-xl border-2 p-1 transition hover:-translate-y-0.5",
                          f.id === s.frameId ? "border-petal bg-white shadow-soft" : "border-transparent bg-petal-mist",
                        )}
                      >
                        <FramePreview frameId={f.id} scale={0.2} className="!rounded-lg" label={f.name} />
                      </button>
                      <span className="mt-1.5 block text-center text-[10px] font-bold leading-tight text-petal-muted">{f.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="field-label">Photo layout</h3>
                <ul className="grid grid-cols-4 gap-2 sm:gap-3">
                  {LAYOUTS.map((l) => {
                    const disabled = l.count > s.photoCount;
                    const on = l.id === s.layoutId;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => s.setLayout(l.id)}
                          aria-pressed={on}
                          title={disabled ? `Needs ${l.count} photos — take more on the camera page` : l.hint}
                          className={cn(
                            "flex w-full flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-petal transition disabled:cursor-not-allowed disabled:opacity-35",
                            on ? "border-petal bg-white shadow-soft" : "border-transparent bg-petal-mist hover:border-petal-line",
                          )}
                        >
                          <LayoutIcon id={l.id} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.03em]">{l.label}</span>
                          <span className="text-[10px] text-petal-muted">{l.hint}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {s.photoCount < 4 && <p className="mt-2 text-[12px] text-petal-muted">Want a 4-photo layout? Take 4 or 5 shots on the camera page.</p>}
              </div>

              <div>
                <h3 className="field-label">Background color</h3>
                <div className="flex flex-wrap items-center gap-2.5">
                  {frame.swatches.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Background ${c}`}
                      aria-pressed={s.bg.toLowerCase() === c.toLowerCase()}
                      onClick={() => s.setBg(c)}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition hover:scale-110",
                        s.bg.toLowerCase() === c.toLowerCase() ? "border-petal ring-2 ring-petal/30" : "border-petal-line",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-petal-line text-petal">
                    <span aria-hidden className="text-[15px] font-bold leading-none">+</span>
                    <span className="sr-only">Custom background color</span>
                    <input type="color" value={s.bg} onChange={(e) => s.setBg(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                  <button type="button" onClick={() => s.setBg(frame.defaultBg)} className="ml-1 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em] text-petal">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "stickers" && <StickerPicker onAdd={addSticker} count={s.items.length} onClear={s.clearItems} />}

          {tab === "text" && (
            <TextControls draft={draft} onDraft={onDraft} color={textColor} onColor={onColor} size={textSize} onSize={onSize} editing={!!editingText} onAdd={addText} />
          )}

          {tab === "photos" && (
            <div>
              <h3 className="field-label">Choose which shot goes where</h3>
              <ul className="space-y-4">
                {s.slotMap.map((photoIndex, slot) => (
                  <li key={slot}>
                    <p className="mb-1.5 text-[12px] font-bold text-petal-muted">Window {slot + 1}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.activePhotos.map((p, i) =>
                        p ? (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => s.assignSlot(slot, i)}
                            aria-pressed={photoIndex === i}
                            aria-label={`Use shot ${i + 1} in window ${slot + 1}`}
                            className={cn(
                              "relative h-[72px] w-14 overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5",
                              photoIndex === i ? "border-petal shadow-soft" : "border-petal-line opacity-80 hover:opacity-100",
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt="" className="h-full w-full object-cover" />
                            <span className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-white/90 text-[9px] font-bold text-petal">{i + 1}</span>
                          </button>
                        ) : null,
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/camera/" className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-petal">
                <Camera className="h-3.5 w-3.5" /> Retake photos
              </Link>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-petal-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/camera/" className="text-center text-[13px] font-bold text-petal-muted hover:text-petal sm:text-left">
            ← Back to camera
          </Link>
          <Link href="/result/" className="btn-primary px-8">
            Preview my photo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
