import { preloadStickers, drawSticker } from "./sticker-render";
import { mulberry32 } from "./draw-utils";
import type { PhotoSource } from "./canvas-renderer";

export interface CapturedPhoto {
  id: string;
  /** Object URL for a JPEG Blob held in browser memory. */
  url: string;
  width: number;
  height: number;
  source: "camera" | "upload";
}

const MAX_SIDE = 1600;
const imageCache = new Map<string, Promise<HTMLImageElement>>();

let counter = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
export const newItemId = () => newId("item");

export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = imageCache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Photo failed to load"));
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return p;
}

export async function toPhotoSource(photo: CapturedPhoto): Promise<PhotoSource> {
  const image = await loadImage(photo.url);
  return { image, width: image.naturalWidth || photo.width, height: image.naturalHeight || photo.height };
}

/** Release the memory behind a photo. */
export function revokePhoto(photo: CapturedPhoto | null | undefined) {
  if (!photo) return;
  imageCache.delete(photo.url);
  URL.revokeObjectURL(photo.url);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create the image"))),
      type,
      quality,
    );
  });
}

/**
 * Grab the current video frame, cropped to exactly what the viewfinder shows (object-fit: cover)
 * so the saved photo matches the preview. Front-camera shots are mirrored like a selfie preview.
 */
export async function captureFromVideo(video: HTMLVideoElement, mirror: boolean): Promise<CapturedPhoto> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error("The camera isn't ready yet");
  const boxAspect = video.clientWidth && video.clientHeight ? video.clientWidth / video.clientHeight : vw / vh;
  const vAspect = vw / vh;
  let sw = vw;
  let sh = vh;
  if (vAspect > boxAspect) sw = vh * boxAspect;
  else sh = vw / boxAspect;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const w = Math.round(sw * k);
  const h = Math.round(sh * k);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  if (mirror) {
    g.translate(w, 0);
    g.scale(-1, 1);
  }
  g.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return { id: newId("photo"), url: URL.createObjectURL(blob), width: w, height: h, source: "camera" };
}

/** Turn a picked file into a downscaled JPEG held in memory. EXIF orientation is honoured. */
export async function photoFromFile(file: File): Promise<CapturedPhoto> {
  let source: CanvasImageSource;
  let sw: number;
  let sh: number;
  let cleanup: (() => void) | undefined;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bmp;
    sw = bmp.width;
    sh = bmp.height;
    cleanup = () => bmp.close();
  } catch {
    const tmp = URL.createObjectURL(file);
    try {
      const img = await loadImage(tmp);
      source = img;
      sw = img.naturalWidth;
      sh = img.naturalHeight;
    } finally {
      imageCache.delete(tmp);
      URL.revokeObjectURL(tmp);
    }
  }
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const w = Math.round(sw * k);
  const h = Math.round(sh * k);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(source, 0, 0, w, h);
  cleanup?.();
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return { id: newId("photo"), url: URL.createObjectURL(blob), width: w, height: h, source: "upload" };
}

/** Pretty example "photos" for the landing-page preview card (no real people needed). */
export async function makeDemoPhotos(count = 4): Promise<PhotoSource[]> {
  const art = ["blossom", "peony", "plumeria", "daisy", "watercolor"];
  await preloadStickers(art);
  const tones: [string, string][] = [
    ["#ffe3ec", "#f8b6cc"],
    ["#fff0e3", "#f9c9d7"],
    ["#efe3fb", "#f6b9d0"],
    ["#e3f4ec", "#f7c1d3"],
  ];
  return Array.from({ length: count }, (_, i) => {
    const w = 900;
    const h = 700;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, tones[i % tones.length][0]);
    grad.addColorStop(1, tones[i % tones.length][1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const rnd = mulberry32(40 + i);
    for (let k = 0; k < 14; k++) {
      g.fillStyle = `rgba(255,255,255,${0.1 + rnd() * 0.25})`;
      g.beginPath();
      g.arc(rnd() * w, rnd() * h, 30 + rnd() * 90, 0, Math.PI * 2);
      g.fill();
    }
    drawSticker(g, art[i % art.length], w / 2, h / 2, 560, i * 17 - 20, false);
    return { image: c, width: w, height: h };
  });
}

/* ----------------------------------------------------------------- downloads */

export function exportFileName(ext: "png" | "jpg") {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `pink-petal-photobooth-${d.getFullYear()}-${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
