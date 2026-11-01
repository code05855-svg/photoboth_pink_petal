import type { Rect } from "./draw-utils";

export type LayoutId = "duo" | "trio" | "strip" | "grid";

export interface LayoutDef {
  id: LayoutId;
  label: string;
  hint: string;
  /** How many photos this layout needs. */
  count: number;
  /** Largest width / height a photo window may have, so stacked windows never become thin slivers. */
  maxAspect: number;
}

export const LAYOUTS: LayoutDef[] = [
  { id: "duo", label: "Duo", hint: "2 big photos", count: 2, maxAspect: 1.45 },
  { id: "trio", label: "Trio", hint: "3 in a column", count: 3, maxAspect: 1.65 },
  { id: "strip", label: "Strip", hint: "4 in a column", count: 4, maxAspect: 1.9 },
  { id: "grid", label: "Grid", hint: "2 × 2 portraits", count: 4, maxAspect: 0.78 },
];

export const getLayout = (id: LayoutId) => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[1];

/** Area of the 1080×1920 canvas reserved for photo cells; the band underneath is for captions. */
export const PHOTO_AREA: Rect = { x: 80, y: 90, w: 920, h: 1530 };
const GAP = 36;

export interface Cell {
  /** Centre of the cell on the canvas. */
  cx: number;
  cy: number;
  /** Outer (frame) size before rotation. */
  w: number;
  h: number;
}

/** Frame-independent cell geometry for a layout. Frames add padding, tilt and decoration on top.
 *  Stacked layouts return full-width cells; getSlots narrows them once the frame's padding is known. */
export function computeCells(id: LayoutId): Cell[] {
  const { x, y, w, h } = PHOTO_AREA;
  const layout = getLayout(id);

  if (id === "grid") {
    const cw = (w - GAP) / 2;
    const ch = Math.min((h - GAP) / 2, cw / layout.maxAspect);
    const top = y + (h - (ch * 2 + GAP)) / 2;
    const cells: Cell[] = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++)
        cells.push({ cx: x + cw / 2 + c * (cw + GAP), cy: top + ch / 2 + r * (ch + GAP), w: cw, h: ch });
    return cells;
  }

  const n = layout.count;
  const ch = (h - GAP * (n - 1)) / n;
  const cw = w;
  return Array.from({ length: n }, (_, i) => ({
    cx: x + w / 2,
    cy: y + ch / 2 + i * (ch + GAP),
    w: cw,
    h: ch,
  }));
}

/** Largest layout that fits the number of captured photos. */
export function bestLayoutFor(photoCount: number, preferred?: LayoutId): LayoutId {
  if (preferred && getLayout(preferred).count <= photoCount) return preferred;
  const fits = LAYOUTS.filter((l) => l.count <= photoCount);
  return (fits.find((l) => l.count === Math.min(photoCount, 4) && l.id !== "grid") ?? fits[fits.length - 1] ?? LAYOUTS[0]).id;
}
