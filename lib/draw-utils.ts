/** Small, dependency-free canvas helpers shared by the frame art and the renderer. */

export type G = CanvasRenderingContext2D;

/** Logical canvas size. Everything is authored on a 1080 × 1920 canvas and scaled for previews. */
export const W = 1080;
export const H = 1920;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Rounded-rect path (does not rely on ctx.roundRect, which older Safari lacks). */
export function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + rad, y);
  g.lineTo(x + w - rad, y);
  g.arcTo(x + w, y, x + w, y + rad, rad);
  g.lineTo(x + w, y + h - rad);
  g.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  g.lineTo(x + rad, y + h);
  g.arcTo(x, y + h, x, y + h - rad, rad);
  g.lineTo(x, y + rad);
  g.arcTo(x, y, x + rad, y, rad);
  g.closePath();
}

/** Deterministic PRNG so glitter/paper grain never shimmer between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [255, 240, 244];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear blend of two hex colours. t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

/** amt in -1..1: negative darkens, positive lightens. */
export function shade(hex: string, amt: number) {
  return amt < 0 ? mix(hex, "#000000", -amt) : mix(hex, "#ffffff", amt);
}

export function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Perceived luminance 0..1. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Classic gingham: translucent stripes in both directions, overlap squares read darker. Clip first. */
export function gingham(g: G, x: number, y: number, w: number, h: number, tile: number, color: string, alpha: number) {
  g.save();
  g.fillStyle = rgba(color, alpha);
  for (let cx = x; cx < x + w; cx += tile * 2) g.fillRect(cx, y, tile, h);
  for (let cy = y; cy < y + h; cy += tile * 2) g.fillRect(x, cy, w, tile);
  g.restore();
}

/** Scalloped (lace-like) rectangle path built from overlapping circles. Fill it to get the union. */
export function scallopRect(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.rect(x + r * 0.5, y + r * 0.5, w - r, h - r);
  const step = r * 1.55;
  const nx = Math.max(2, Math.round((w - r * 2) / step));
  const ny = Math.max(2, Math.round((h - r * 2) / step));
  for (let i = 0; i <= nx; i++) {
    const cx = x + r + ((w - r * 2) * i) / nx;
    g.moveTo(cx + r, y + r * 0.5);
    g.arc(cx, y + r * 0.5, r, 0, Math.PI * 2);
    g.moveTo(cx + r, y + h - r * 0.5);
    g.arc(cx, y + h - r * 0.5, r, 0, Math.PI * 2);
  }
  for (let j = 0; j <= ny; j++) {
    const cy = y + r + ((h - r * 2) * j) / ny;
    g.moveTo(x + r * 0.5 + r, cy);
    g.arc(x + r * 0.5, cy, r, 0, Math.PI * 2);
    g.moveTo(x + w - r * 0.5 + r, cy);
    g.arc(x + w - r * 0.5, cy, r, 0, Math.PI * 2);
  }
}

/** Four-point sparkle path centred on (cx, cy). */
export function sparklePath(g: G, cx: number, cy: number, r: number) {
  const k = r * 0.18;
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.quadraticCurveTo(cx + k, cy - k, cx + r, cy);
  g.quadraticCurveTo(cx + k, cy + k, cx, cy + r);
  g.quadraticCurveTo(cx - k, cy + k, cx - r, cy);
  g.quadraticCurveTo(cx - k, cy - k, cx, cy - r);
  g.closePath();
}

/** Heart path, s ≈ half-width. */
export function heartPath(g: G, cx: number, cy: number, s: number) {
  g.beginPath();
  g.moveTo(cx, cy + s * 0.95);
  g.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.85, cy - s * 1.05, cx, cy - s * 0.35);
  g.bezierCurveTo(cx + s * 0.85, cy - s * 1.05, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.95);
  g.closePath();
}

/** Ragged "torn paper" polygon around a rectangle. */
export function tornRectPath(g: G, x: number, y: number, w: number, h: number, jitter: number, seed: number) {
  const rnd = mulberry32(seed);
  const step = 26;
  g.beginPath();
  const pt = (px: number, py: number) => [px + (rnd() - 0.5) * jitter * 2, py + (rnd() - 0.5) * jitter * 2] as const;
  let first = true;
  const add = (px: number, py: number) => {
    const [a, b] = pt(px, py);
    if (first) {
      g.moveTo(a, b);
      first = false;
    } else g.lineTo(a, b);
  };
  for (let i = 0; i <= w; i += step) add(x + i, y);
  for (let i = 0; i <= h; i += step) add(x + w, y + i);
  for (let i = 0; i <= w; i += step) add(x + w - i, y + h);
  for (let i = 0; i <= h; i += step) add(x, y + h - i);
  g.closePath();
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
