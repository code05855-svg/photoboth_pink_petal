"use client";

import { ArrowUpToLine, Trash2 } from "lucide-react";
import { STICKERS, stickerUrl } from "@/lib/stickers";
import type { Item } from "@/lib/canvas-renderer";
import { cn } from "@/lib/cn";

export const TEXT_COLORS = ["#33252C", "#D81B60", "#B3154E", "#1F3A6E", "#3F7BD6", "#FFFFFF", "#7B3FA0", "#2F7D6B"];

/* ------------------------------------------------------------------ stickers */

const GROUPS = [
  { id: "flowers", label: "Flowers & branches" },
  { id: "cute", label: "Hearts, bows & sparkles" },
  { id: "blue", label: "Classic blue" },
] as const;

export function StickerPicker({ onAdd, count, onClear }: { onAdd: (id: string) => void; count: number; onClear: () => void }) {
  return (
    <div>
      {GROUPS.map((g) => (
        <section key={g.id} className="mb-5" aria-label={g.label}>
          <h3 className="field-label">{g.label} · tap to add</h3>
          <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
            {STICKERS.filter((s) => s.group === g.id).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onAdd(s.id)}
                  aria-label={`Add ${s.label}`}
                  title={s.label}
                  className="grid aspect-square w-full place-items-center rounded-2xl border border-petal-line bg-petal-mist p-1.5 transition hover:-translate-y-0.5 hover:border-petal hover:bg-white hover:shadow-soft active:scale-95"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stickerUrl(s.id)} alt="" className="h-full w-full object-contain" draggable={false} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <button
        type="button"
        onClick={onClear}
        disabled={count === 0}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-petal disabled:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5" /> Remove all decorations{count ? ` (${count})` : ""}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ text */

interface TextProps {
  draft: string;
  onDraft: (v: string) => void;
  color: string;
  onColor: (c: string) => void;
  size: number;
  onSize: (n: number) => void;
  editing: boolean;
  onAdd: () => void;
}

export function TextControls({ draft, onDraft, color, onColor, size, onSize, editing, onAdd }: TextProps) {
  return (
    <div>
      <label htmlFor="note" className="field-label">
        {editing ? "Editing your note" : "Add a little note"}
      </label>
      <div className="flex gap-2">
        <input
          id="note"
          type="text"
          value={draft}
          maxLength={40}
          placeholder="write something sweet…"
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !editing && draft.trim()) onAdd();
          }}
          className="min-w-0 flex-1 rounded-2xl border border-petal-line bg-petal-mist px-4 py-3.5 text-[15px] placeholder:text-petal-muted/80"
        />
        <button type="button" onClick={onAdd} disabled={!draft.trim()} className="btn-primary !px-5">
          {editing ? "Add another" : "Add"}
        </button>
      </div>
      <p className="mt-2 text-[12px] text-petal-muted">
        {editing ? "Changes show on the strip as you type." : "Your note appears on the strip. Drag it wherever you like."}
      </p>

      <fieldset className="mt-5">
        <legend className="field-label">Text color</legend>
        <div className="flex flex-wrap items-center gap-2.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Text color ${c}`}
              aria-pressed={color.toLowerCase() === c.toLowerCase()}
              onClick={() => onColor(c)}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition hover:scale-110",
                color.toLowerCase() === c.toLowerCase() ? "border-petal ring-2 ring-petal/30" : "border-petal-line",
              )}
              style={{ background: c }}
            />
          ))}
          <label className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-petal-line text-[10px] font-bold text-petal">
            <span aria-hidden>+</span>
            <span className="sr-only">Custom text color</span>
            <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="text-size" className="field-label">
          Text size · {Math.round(size)}
        </label>
        <input id="text-size" type="range" min={28} max={200} value={size} onChange={(e) => onSize(Number(e.target.value))} className="w-full" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ selection bar */

interface BarProps {
  item: Item | null;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onFront: () => void;
}

/** Sits under the preview: resize, rotate, bring to front or remove whatever is selected. */
export function SelectionBar({ item, onChange, onRemove, onFront }: BarProps) {
  if (!item) {
    return (
      <p className="rounded-2xl bg-petal-mist px-4 py-3 text-center text-[13px] text-petal-muted">
        Tap a sticker to add it, then drag it into place. Drag its corner handle to resize and rotate.
      </p>
    );
  }
  const isText = item.kind === "text";
  return (
    <div className="rounded-2xl bg-petal-mist p-4" role="group" aria-label={isText ? "Selected note" : "Selected sticker"}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-petal">{isText ? "Selected note" : "Selected sticker"}</p>
        <div className="flex gap-1.5">
          <button type="button" onClick={onFront} className="grid h-9 w-9 place-items-center rounded-full bg-white text-petal hover:bg-petal-rose" aria-label="Bring to front" title="Bring to front">
            <ArrowUpToLine className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-full bg-white text-petal hover:bg-petal-rose" aria-label="Remove" title="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-bold text-petal-muted">
          Size
          <input
            type="range"
            min={isText ? 28 : 80}
            max={isText ? 200 : 720}
            value={item.size}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            className="mt-1 block w-full"
          />
        </label>
        <label className="block text-[12px] font-bold text-petal-muted">
          Rotate
          <input
            type="range"
            min={-180}
            max={180}
            value={Math.round(((item.rotation + 540) % 360) - 180)}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
            className="mt-1 block w-full"
          />
        </label>
      </div>
    </div>
  );
}
