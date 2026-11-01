import { FRAME_ART } from "./frame-art";
import { getFrame, padFor, type FrameId } from "./frame-config";
import { computeCells, getLayout, type LayoutId } from "./layouts";
import { drawSticker, preloadStickers } from "./sticker-render";
import { ensureFonts } from "./fonts";
import { H, W, G, Rect, luminance, mix, rr } from "./draw-utils";

/* ----------------------------------------------------------------- types */

/** A decoration placed on the composition, in 1080 × 1920 canvas coordinates. */
export interface Item {
  id: string;
  kind: "sticker" | "text";
  /** Centre. */
  x: number;
  y: number;
  /** Sticker width, or text font size, in canvas px. */
  size: number;
  /** Degrees. */
  rotation: number;
  stickerId?: string;
  text?: string;
  color?: string;
}

export interface PhotoSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export interface Composition {
  frameId: FrameId;
  layoutId: LayoutId;
  bg: string;
  /** One entry per slot of the layout; null shows a placeholder. */
  photos: (PhotoSource | null)[];
  items: Item[];
}

export interface Slot {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Radians. */
  rot: number;
  /** Photo window relative to the cell centre. */
  photo: Rect;
}

const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"DM Sans Variable", system-ui, sans-serif';

/* ----------------------------------------------------------------- geometry */

export function getSlots(frameId: FrameId, layoutId: LayoutId): Slot[] {
  const f = getFrame(frameId);
  const pad = padFor(f, layoutId);
  const maxAspect = getLayout(layoutId).maxAspect;
  return computeCells(layoutId).map((c, i) => {
    const windowH = c.h - pad.top - pad.bottom;
    // Stacked layouts: keep the photo window from getting thinner than maxAspect : 1.
    const w = layoutId === "grid" ? c.w : Math.min(c.w, windowH * maxAspect + pad.side * 2);
    return {
      cx: c.cx,
      cy: c.cy,
      w,
      h: c.h,
      rot: ((f.tilts[i % f.tilts.length] ?? 0) * Math.PI) / 180,
      photo: { x: -w / 2 + pad.side, y: -c.h / 2 + pad.top, w: w - pad.side * 2, h: windowH },
    };
  });
}

let measureCtx: CanvasRenderingContext2D | null = null;
function measure() {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")!;
  return measureCtx;
}

export function textFont(size: number) {
  return `italic 700 ${size}px ${SERIF}`;
}

/** Unrotated box around an item, used for hit-testing and the selection outline. */
export function itemBounds(item: Item): { w: number; h: number } {
  if (item.kind === "sticker") return { w: item.size * 0.92, h: item.size * 0.92 };
  const g = measure();
  g.font = textFont(item.size);
  return { w: g.measureText(item.text || " ").width + item.size * 0.4, h: item.size * 1.4 };
}

function toLocal(item: Item, px: number, py: number) {
  const a = (-item.rotation * Math.PI) / 180;
  const dx = px - item.x;
  const dy = py - item.y;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

function toCanvas(item: Item, lx: number, ly: number) {
  const a = (item.rotation * Math.PI) / 180;
  return { x: item.x + lx * Math.cos(a) - ly * Math.sin(a), y: item.y + lx * Math.sin(a) + ly * Math.cos(a) };
}

export function hitItem(item: Item, px: number, py: number) {
  const b = itemBounds(item);
  const p = toLocal(item, px, py);
  return Math.abs(p.x) <= b.w / 2 && Math.abs(p.y) <= b.h / 2;
}

/** Topmost item under a point, or null. */
export function hitTest(items: Item[], px: number, py: number): Item | null {
  for (let i = items.length - 1; i >= 0; i--) if (hitItem(items[i], px, py)) return items[i];
  return null;
}

const HANDLE_PAD = 16;
export const HANDLE_R = 20;

/** Where the resize/rotate and remove handles sit for a selected item (canvas coordinates). */
export function handlePositions(item: Item) {
  const b = itemBounds(item);
  const hw = b.w / 2 + HANDLE_PAD;
  const hh = b.h / 2 + HANDLE_PAD;
  return { resize: toCanvas(item, hw, hh), remove: toCanvas(item, -hw, -hh) };
}

/* ----------------------------------------------------------------- drawing */

function drawPhoto(g: G, src: PhotoSource, r: Rect, radius: number) {
  g.save();
  rr(g, r.x, r.y, r.w, r.h, radius);
  g.clip();
  const target = r.w / r.h;
  const source = src.width / src.height;
  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;
  if (source > target) {
    sh = src.height;
    sw = sh * target;
    sx = (src.width - sw) / 2;
    sy = 0;
  } else {
    sw = src.width;
    sh = sw / target;
    sx = 0;
    sy = (src.height - sh) * 0.4; // faces sit a little above centre
  }
  g.drawImage(src.image, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
  g.restore();
}

function drawPlaceholder(g: G, r: Rect, radius: number, accent: string) {
  g.save();
  rr(g, r.x, r.y, r.w, r.h, radius);
  g.fillStyle = mix(accent, "#ffffff", 0.88);
  g.fill();
  g.fillStyle = mix(accent, "#ffffff", 0.35);
  g.font = `700 ${Math.max(22, Math.min(r.w, r.h) * 0.075)}px ${SANS}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("YOUR PHOTO", r.x + r.w / 2, r.y + r.h / 2);
  g.restore();
}

/** Background, frame artwork and photos. Everything except the user's own decorations. */
export function drawBase(g: G, comp: Composition) {
  const frame = getFrame(comp.frameId);
  const art = FRAME_ART[frame.id];
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, W, H);
  art.background({ g, bg: comp.bg });

  getSlots(frame.id, comp.layoutId).forEach((s, i) => {
    g.save();
    g.translate(s.cx, s.cy);
    g.rotate(s.rot);
    const ctx = { g, bg: comp.bg, index: i, w: s.w, h: s.h, photo: s.photo };
    art.slotBack(ctx);
    const photo = comp.photos[i];
    if (photo) drawPhoto(g, photo, s.photo, frame.radius);
    else drawPlaceholder(g, s.photo, frame.radius, frame.accent);
    g.strokeStyle = "rgba(90,30,55,0.14)";
    g.lineWidth = 2;
    rr(g, s.photo.x, s.photo.y, s.photo.w, s.photo.h, frame.radius);
    g.stroke();
    art.slotFront(ctx);
    g.restore();
  });
}

function drawText(g: G, item: Item) {
  const color = item.color || "#33252C";
  g.save();
  g.translate(item.x, item.y);
  g.rotate((item.rotation * Math.PI) / 180);
  g.font = textFont(item.size);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = Math.max(4, item.size * 0.2);
  g.strokeStyle = luminance(color) > 0.72 ? "rgba(70,30,48,0.55)" : "rgba(255,255,255,0.92)";
  g.strokeText(item.text || "", 0, 0);
  g.fillStyle = color;
  g.fillText(item.text || "", 0, 0);
  g.restore();
}

/** Stickers and captions, in order (last = on top). */
export function drawItems(g: G, items: Item[]) {
  for (const item of items) {
    if (item.kind === "sticker" && item.stickerId) drawSticker(g, item.stickerId, item.x, item.y, item.size, item.rotation, true);
    else if (item.kind === "text") drawText(g, item);
  }
}

/** Selection outline + handles. Preview only — never part of an export. `px` converts screen px → canvas px. */
export function drawSelection(g: G, item: Item, px: number) {
  const b = itemBounds(item);
  g.save();
  g.translate(item.x, item.y);
  g.rotate((item.rotation * Math.PI) / 180);
  g.setLineDash([10 * px, 7 * px]);
  g.lineWidth = 2.5 * px;
  g.strokeStyle = "#d81b60";
  rr(g, -b.w / 2 - HANDLE_PAD * 0.6, -b.h / 2 - HANDLE_PAD * 0.6, b.w + HANDLE_PAD * 1.2, b.h + HANDLE_PAD * 1.2, 14 * px);
  g.stroke();
  g.restore();

  const h = handlePositions(item);
  const r = HANDLE_R * px * 0.75;
  // Remove (×)
  g.save();
  g.fillStyle = "#d81b60";
  g.beginPath();
  g.arc(h.remove.x, h.remove.y, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 2.6 * px;
  g.lineCap = "round";
  const k = r * 0.38;
  g.beginPath();
  g.moveTo(h.remove.x - k, h.remove.y - k);
  g.lineTo(h.remove.x + k, h.remove.y + k);
  g.moveTo(h.remove.x + k, h.remove.y - k);
  g.lineTo(h.remove.x - k, h.remove.y + k);
  g.stroke();
  // Resize / rotate
  g.fillStyle = "#fff";
  g.strokeStyle = "#d81b60";
  g.lineWidth = 2.6 * px;
  g.beginPath();
  g.arc(h.resize.x, h.resize.y, r, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(h.resize.x, h.resize.y, r * 0.5, -0.3 * Math.PI, 1.2 * Math.PI);
  g.stroke();
  g.restore();
}

/* ----------------------------------------------------------------- orchestration */

export function neededStickers(comp: Composition): string[] {
  const ids = [...getFrame(comp.frameId).ornaments];
  for (const it of comp.items) if (it.kind === "sticker" && it.stickerId) ids.push(it.stickerId);
  return ids;
}

/** Wait for fonts and stickers so the first render is complete (no missing glyphs or art). */
export async function prepareComposition(comp: Composition): Promise<void> {
  await Promise.all([ensureFonts(), preloadStickers(neededStickers(comp))]);
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}

/** Cacheable layer: background + frame + photos at the given scale. */
export function renderBase(comp: Composition, scale: number): HTMLCanvasElement {
  const c = makeCanvas(W * scale, H * scale);
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  drawBase(g, comp);
  return c;
}

/** Paint a cached base plus live items onto a preview canvas. */
export function paintPreview(target: HTMLCanvasElement, base: HTMLCanvasElement, comp: Composition, selectedId: string | null) {
  const g = target.getContext("2d")!;
  const scale = target.width / W;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, target.width, target.height);
  g.drawImage(base, 0, 0, target.width, target.height);
  g.setTransform(scale, 0, 0, scale, 0, 0);
  drawItems(g, comp.items);
  const sel = selectedId ? comp.items.find((i) => i.id === selectedId) : null;
  if (sel) drawSelection(g, sel, 1 / scale);
}

/** Full render. scale = 1 gives the 1080 × 1920 export; no selection UI is ever drawn here. */
export function renderComposition(comp: Composition, scale = 1): HTMLCanvasElement {
  const c = makeCanvas(W * scale, H * scale);
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  drawBase(g, comp);
  drawItems(g, comp.items);
  return c;
}
