import { getStickerDef, stickerUrl } from "./stickers";
import type { G } from "./draw-utils";

/**
 * Stickers are rasterised once to canvases. Two variants are cached:
 *  - plain:  the artwork as-is (transparent PNG-equivalent)
 *  - cutout: the artwork with a white die-cut border and a soft shadow, like a real sticker
 */

const BASE = 512; // raster size of the artwork
const PAD = 26; // room for the outline + shadow around the cutout variant
const OUTLINE = 11;

interface Prepared {
  plain: HTMLCanvasElement;
  cutout: HTMLCanvasElement;
}

const ready = new Map<string, Prepared>();
const pending = new Map<string, Promise<void>>();

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function loadSvg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Sticker failed to load"));
    img.src = url;
  });
}

function prepare(img: HTMLImageElement, shadow: string): Prepared {
  const plain = makeCanvas(BASE, BASE);
  plain.getContext("2d")!.drawImage(img, 0, 0, BASE, BASE);

  const size = BASE + PAD * 2;
  // White silhouette of the artwork.
  const sil = makeCanvas(size, size);
  const sg = sil.getContext("2d")!;
  sg.drawImage(plain, PAD, PAD);
  sg.globalCompositeOperation = "source-in";
  sg.fillStyle = "#ffffff";
  sg.fillRect(0, 0, size, size);

  const cutout = makeCanvas(size, size);
  const cg = cutout.getContext("2d")!;
  // Outer ring (with shadow) then a tighter ring to fill any gaps, then the artwork on top.
  cg.shadowColor = shadow;
  cg.shadowBlur = 16;
  cg.shadowOffsetY = 6;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    cg.drawImage(sil, Math.cos(a) * OUTLINE, Math.sin(a) * OUTLINE);
  }
  cg.shadowColor = "transparent";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    cg.drawImage(sil, Math.cos(a) * OUTLINE * 0.5, Math.sin(a) * OUTLINE * 0.5);
  }
  cg.drawImage(plain, PAD, PAD);
  return { plain, cutout };
}

/** Make sure the given stickers are rasterised. Safe to call repeatedly. */
export async function preloadStickers(ids: string[]): Promise<void> {
  await Promise.all(
    Array.from(new Set(ids)).map((id) => {
      if (ready.has(id)) return Promise.resolve();
      let p = pending.get(id);
      if (!p) {
        const def = getStickerDef(id);
        if (!def) return Promise.resolve();
        p = loadSvg(stickerUrl(id))
          .then((img) => {
            // Shadow follows the sticker's color family so blue stickers don't get a pink halo.
            ready.set(id, prepare(img, id.startsWith("blue-") ? "rgba(30,60,130,0.30)" : "rgba(150,40,80,0.28)"));
          })
          .catch(() => {
            /* a missing sticker should never break the whole composition */
          })
          .finally(() => pending.delete(id));
        pending.set(id, p);
      }
      return p;
    }),
  );
}

export function stickersReady(ids: string[]) {
  return ids.every((id) => ready.has(id));
}

/**
 * Draw a sticker centred on (x, y). `size` is the width of the artwork box in canvas px.
 */
export function drawSticker(
  g: G,
  id: string,
  x: number,
  y: number,
  size: number,
  rotationDeg = 0,
  cutout = true,
  alpha = 1,
) {
  const p = ready.get(id);
  if (!p) return;
  const src = cutout ? p.cutout : p.plain;
  const scale = size / BASE;
  const w = src.width * scale;
  g.save();
  g.globalAlpha *= alpha;
  g.translate(x, y);
  g.rotate((rotationDeg * Math.PI) / 180);
  g.drawImage(src, -w / 2, -w / 2, w, w);
  g.restore();
}
