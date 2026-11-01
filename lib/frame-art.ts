import {
  G,
  H,
  W,
  Rect,
  gingham,
  heartPath,
  mix,
  mulberry32,
  rgba,
  rr,
  scallopRect,
  shade,
  sparklePath,
  tornRectPath,
} from "./draw-utils";
import { drawSticker } from "./sticker-render";
import type { FrameId } from "./frame-config";

export interface ArtCtx {
  g: G;
  bg: string;
}

/** Slot drawing happens in the cell's local space: origin at the cell centre, already rotated. */
export interface SlotCtx extends ArtCtx {
  index: number;
  /** Outer size of the cell. */
  w: number;
  h: number;
  /** Photo window, relative to the cell centre. */
  photo: Rect;
}

export interface FrameArt {
  background(c: ArtCtx): void;
  slotBack(c: SlotCtx): void;
  slotFront(c: SlotCtx): void;
}

const SERIF = '"Playfair Display", Georgia, serif';
const PINK = "#d81b60";

function softShadow(g: G, blur = 28, y = 12, a = 0.26) {
  g.shadowColor = `rgba(130,40,75,${a})`;
  g.shadowBlur = blur;
  g.shadowOffsetY = y;
}

function polaroidBack(c: SlotCtx, paper: string) {
  const { g, w, h } = c;
  g.save();
  softShadow(g);
  g.fillStyle = paper;
  rr(g, -w / 2, -h / 2, w, h, 7);
  g.fill();
  g.restore();
  g.strokeStyle = "rgba(120,60,80,0.08)";
  g.lineWidth = 2;
  rr(g, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 7);
  g.stroke();
}

function paperGrain(g: G, x: number, y: number, w: number, h: number, seed: number, tone: string, count = 1400) {
  const rnd = mulberry32(seed);
  g.save();
  g.fillStyle = tone;
  for (let i = 0; i < count; i++) g.fillRect(x + rnd() * w, y + rnd() * h, 1.6, 1.6);
  g.restore();
}

/* ------------------------------------------------------------------ 1. Coquette Lace */

const coquette: FrameArt = {
  background({ g, bg }) {
    g.fillStyle = mix(bg, "#ffffff", 0.38);
    g.fillRect(0, 0, W, H);

    // Love-letter script texture.
    const phrases = ["my dearest, you are so sweet", "love letters in pink", "a little frame, a lot of lovely", "forever & always, xoxo"];
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(-0.2);
    g.font = `italic 600 34px ${SERIF}`;
    g.fillStyle = rgba(shade(bg, -0.5), 0.15);
    g.textBaseline = "alphabetic";
    let row = 0;
    for (let y = -1500; y < 1500; y += 58, row++) {
      let x = -1100 + ((row * 173) % 420);
      let k = row;
      while (x < 1100) {
        const t = phrases[k++ % phrases.length] + "   ";
        g.fillText(t, x, y);
        x += g.measureText(t).width;
      }
    }
    g.restore();

    const gingTone = mix(bg, PINK, 0.5);
    const corner = (pts: [number, number][]) => {
      g.save();
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.clip();
      g.fillStyle = "rgba(255,255,255,0.62)";
      g.fillRect(0, 0, W, H);
      gingham(g, 0, 0, W, H, 46, gingTone, 0.3);
      g.restore();
      g.save();
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.setLineDash([12, 9]);
      g.lineWidth = 4;
      g.strokeStyle = "rgba(255,255,255,0.95)";
      g.lineDashOffset = 0;
      g.stroke();
      g.restore();
    };
    corner([[0, 0], [720, 0], [0, 860]]);
    corner([[W, H], [W - 780, H], [W, H - 900]]);

    // Lace trim down the left edge.
    g.save();
    softShadow(g, 14, 0, 0.18);
    g.fillStyle = "#fff8f4";
    g.fillRect(-10, 0, 80, H);
    for (let y = 0; y < H + 44; y += 44) {
      g.beginPath();
      g.arc(70, y + 22, 23, -Math.PI / 2, Math.PI / 2);
      g.fill();
    }
    g.restore();
    g.fillStyle = rgba("#f06292", 0.45);
    for (let y = 0; y < H; y += 44) {
      g.beginPath();
      g.arc(34, y + 22, 5.5, 0, Math.PI * 2);
      g.fill();
    }

    drawSticker(g, "peony", 944, 232, 330, 12);
    drawSticker(g, "blossom", 120, 1190, 270, -16);
    drawSticker(g, "camera", 122, 1500, 200, -14);
    drawSticker(g, "heart", 972, 905, 120, 12);
    drawSticker(g, "sparkles", 930, 1520, 220, 6);
    drawSticker(g, "blossom", 214, 1790, 200, 20);
    drawSticker(g, "sparkles", 905, 1800, 170, -10);
  },
  slotBack(c) {
    const { g, w, h } = c;
    g.save();
    softShadow(g, 26, 12, 0.24);
    g.fillStyle = "#fffaf7";
    scallopRect(g, -w / 2, -h / 2, w, h, 12);
    g.fill();
    g.restore();
    g.strokeStyle = "#f28fb0";
    g.lineWidth = 4;
    rr(g, -w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 10);
    g.stroke();
    g.save();
    g.setLineDash([9, 7]);
    g.lineWidth = 2.5;
    g.strokeStyle = "#f7b3c8";
    rr(g, -w / 2 + 30, -h / 2 + 30, w - 60, h - 60, 8);
    g.stroke();
    g.restore();
  },
  slotFront({ g, w, h, index }) {
    if (index % 2 === 0) drawSticker(g, "bow", -w / 2 + 34, -h / 2 + 28, 190, -14);
    else drawSticker(g, "bow", w / 2 - 34, h / 2 - 26, 180, 12);
  },
};

/* ------------------------------------------------------------------ 2. Kawaii Style */

const kawaii: FrameArt = {
  background({ g, bg }) {
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, mix(bg, "#ffffff", 0.6));
    grad.addColorStop(1, bg);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // Watercolor washes.
    const rnd = mulberry32(21);
    const palette = ["#f8b6cc", "#e5d0f7", "#cfeee3", "#ffd9b8", "#f6a5c0"];
    for (let i = 0; i < 17; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = 160 + rnd() * 190;
      const col = palette[i % palette.length];
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(col, 0.55));
      rg.addColorStop(0.65, rgba(col, 0.22));
      rg.addColorStop(1, rgba(col, 0));
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Torn paper sheet.
    g.save();
    softShadow(g, 30, 12, 0.22);
    g.fillStyle = "#ffffff";
    tornRectPath(g, 44, 44, W - 88, H - 88, 9, 3);
    g.fill();
    g.restore();
    g.fillStyle = "#fffaf6";
    tornRectPath(g, 58, 58, W - 116, H - 116, 5, 11);
    g.fill();
    paperGrain(g, 60, 60, W - 120, H - 120, 5, "rgba(190,140,155,0.10)");

    // Faint washes on the paper too.
    for (let i = 0; i < 6; i++) {
      const x = 120 + rnd() * (W - 240);
      const y = 120 + rnd() * (H - 240);
      const r = 130 + rnd() * 120;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(palette[i % palette.length], 0.28));
      rg.addColorStop(1, rgba(palette[i % palette.length], 0));
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    drawSticker(g, "watercolor", 150, 170, 380, -12, false);
    drawSticker(g, "plumeria", 940, 1760, 380, 10, false);
    drawSticker(g, "star", 930, 150, 160, 14);
    drawSticker(g, "butterfly", 120, 880, 170, -24);
    drawSticker(g, "sparkles", 165, 1770, 230, 0);
    drawSticker(g, "heart", 975, 1010, 110, 12);
  },
  slotBack(c) {
    polaroidBack(c, "#ffffff");
    // Little kawaii face on the polaroid's chin.
    const { g, w, h } = c;
    const cy = (c.photo.y + c.photo.h + h / 2) / 2; // middle of the chin, whatever its height
    g.save();
    g.fillStyle = "#6b3a4d";
    g.beginPath();
    g.arc(-17, cy - 5, 5, 0, Math.PI * 2);
    g.arc(17, cy - 5, 5, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 3.4;
    g.lineCap = "round";
    g.strokeStyle = "#6b3a4d";
    g.beginPath();
    g.arc(0, cy + 2, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.fillStyle = "rgba(255,111,159,0.5)";
    g.beginPath();
    g.ellipse(-33, cy + 4, 9, 5.5, 0, 0, Math.PI * 2);
    g.ellipse(33, cy + 4, 9, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    void w;
  },
  slotFront({ g, h, index }) {
    drawSticker(g, "tape", 0, -h / 2 + 8, 210, index % 2 ? 7 : -7, false);
  },
};

/* ------------------------------------------------------------------ 3. Love Notes */

const loveNotes: FrameArt = {
  background({ g, bg }) {
    g.fillStyle = mix(bg, "#ffffff", 0.74);
    g.fillRect(0, 0, W, H);
    paperGrain(g, 0, 0, W, H, 9, "rgba(190,140,155,0.07)", 1800);

    // Notebook rules + margin line.
    g.strokeStyle = rgba("#ec6c9b", 0.26);
    g.lineWidth = 2.5;
    for (let y = 150; y < H; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    g.strokeStyle = rgba("#e2406f", 0.34);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(156, 0);
    g.lineTo(156, H);
    g.stroke();

    // Gingham border.
    const tone = mix(bg, PINK, 0.55);
    g.save();
    g.beginPath();
    g.rect(0, 0, W, H);
    g.rect(56, 56, W - 112, H - 112);
    g.clip("evenodd");
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, H);
    gingham(g, 0, 0, W, H, 28, tone, 0.42);
    g.restore();
    g.save();
    g.lineWidth = 7;
    g.strokeStyle = "#ffffff";
    rr(g, 56, 56, W - 112, H - 112, 6);
    g.stroke();
    g.setLineDash([9, 8]);
    g.lineWidth = 3;
    g.strokeStyle = rgba(tone, 0.85);
    rr(g, 70, 70, W - 140, H - 140, 4);
    g.stroke();
    g.restore();

    // Hand-drawn hearts in the margins.
    g.save();
    g.lineWidth = 4.5;
    g.lineCap = "round";
    g.strokeStyle = rgba("#e2406f", 0.5);
    ([[108, 270, 26, -0.3], [978, 520, 22, 0.3], [106, 990, 24, 0.2], [976, 1250, 28, -0.2], [112, 1480, 20, 0.35], [972, 800, 18, -0.3]] as const).forEach(([x, y, s, a]) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      heartPath(g, 0, 0, s);
      g.stroke();
      g.restore();
    });
    g.fillStyle = rgba("#ec6c9b", 0.55);
    ([[990, 1500, 12], [96, 640, 11], [980, 300, 10]] as const).forEach(([x, y, s]) => {
      heartPath(g, x, y, s);
      g.fill();
    });
    g.restore();

    drawSticker(g, "star", 972, 190, 130, 12);
    drawSticker(g, "hearts", 126, 1770, 230, -8);
    drawSticker(g, "sparkle", 950, 1740, 140, 0);
    drawSticker(g, "heart", 100, 220, 110, -14);
  },
  slotBack(c) {
    const { g, w, h, bg } = c;
    const tone = mix(bg, PINK, 0.5);
    g.save();
    softShadow(g, 22, 9, 0.22);
    g.fillStyle = "#ffffff";
    rr(g, -w / 2, -h / 2, w, h, 30);
    g.fill();
    g.restore();
    g.save();
    rr(g, -w / 2, -h / 2, w, h, 30);
    g.clip();
    gingham(g, -w / 2, -h / 2, w, h, 17, tone, 0.44);
    g.restore();
    g.fillStyle = "#fffafb";
    rr(g, -w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 18);
    g.fill();
    g.save();
    g.setLineDash([7, 6]);
    g.lineWidth = 2;
    g.strokeStyle = rgba(tone, 0.8);
    rr(g, -w / 2 + 28, -h / 2 + 28, w - 56, h - 56, 14);
    g.stroke();
    g.restore();
  },
  slotFront({ g, w, h, index }) {
    drawSticker(g, "bow", -w / 2 + 28, -h / 2 + 22, 150, -16);
    if (index % 2 === 0) drawSticker(g, "star", w / 2 - 30, h / 2 - 28, 92, 14);
    else drawSticker(g, "heart", w / 2 - 30, h / 2 - 28, 78, -12);
  },
};

/* ------------------------------------------------------------------ 4. Pink Picnic */

const pinkPicnic: FrameArt = {
  background({ g, bg }) {
    g.fillStyle = mix(bg, "#ffffff", 0.52);
    g.fillRect(0, 0, W, H);
    gingham(g, 0, 0, W, H, 62, mix(bg, PINK, 0.4), 0.3);
    // Soft vignette so the blanket feels laid out on the grass.
    const v = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150);
    v.addColorStop(0, "rgba(255,255,255,0.18)");
    v.addColorStop(1, "rgba(150,40,80,0.16)");
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);

    drawSticker(g, "strawberry", 140, 1710, 270, -16);
    drawSticker(g, "strawberry", 940, 160, 220, 20);
    drawSticker(g, "daisy", 945, 1660, 250, 8);
    drawSticker(g, "daisy", 100, 200, 170, -10);
    drawSticker(g, "butterfly", 985, 860, 160, 22);
    drawSticker(g, "tulip", 96, 900, 200, -12);
    drawSticker(g, "sparkles", 560, 1800, 190, 0);
  },
  slotBack(c) {
    polaroidBack(c, "#ffffff");
  },
  slotFront({ g, w, h, index }) {
    if (index % 2 === 0) drawSticker(g, "bow", -w / 2 + 40, -h / 2 + 18, 190, -22);
    else drawSticker(g, "bow", w / 2 - 40, -h / 2 + 18, 190, 22);
  },
};

/* ------------------------------------------------------------------ 5. Pink Memories */

const pinkMemories: FrameArt = {
  background({ g, bg }) {
    g.fillStyle = mix(bg, "#ffffff", 0.58);
    g.fillRect(0, 0, W, H);

    // Offset plate behind the card, like the reference.
    g.fillStyle = shade(bg, -0.2);
    rr(g, 54, 56, W - 68, H - 68, 78);
    g.fill();

    g.save();
    softShadow(g, 24, 8, 0.2);
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, mix(bg, "#ffffff", 0.38));
    grad.addColorStop(0.5, bg);
    grad.addColorStop(1, shade(bg, -0.1));
    g.fillStyle = grad;
    rr(g, 34, 34, W - 68, H - 68, 78);
    g.fill();
    g.restore();

    g.save();
    rr(g, 34, 34, W - 68, H - 68, 78);
    g.clip();
    const rnd = mulberry32(2024);
    for (let i = 0; i < 2600; i++) {
      const x = 34 + rnd() * (W - 68);
      const y = 34 + rnd() * (H - 68);
      g.fillStyle = `rgba(255,255,255,${0.12 + rnd() * 0.7})`;
      const s = 0.8 + rnd() * 2.2;
      g.fillRect(x, y, s, s);
    }
    for (let i = 0; i < 120; i++) {
      const x = 60 + rnd() * (W - 120);
      const y = 60 + rnd() * (H - 120);
      g.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.4})`;
      sparklePath(g, x, y, 5 + rnd() * 11);
      g.fill();
    }
    const hl = g.createRadialGradient(260, 220, 0, 260, 220, 760);
    hl.addColorStop(0, "rgba(255,255,255,0.28)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = hl;
    g.fillRect(0, 0, W, H);
    g.restore();

    drawSticker(g, "butterfly", 934, 200, 240, 15);
    drawSticker(g, "butterfly", 134, 1500, 200, -20);
    drawSticker(g, "plumeria", 944, 1740, 340, 10);
    drawSticker(g, "sparkles", 165, 1770, 230, 0);
    drawSticker(g, "heart", 978, 960, 110, 14);
    drawSticker(g, "bow", 112, 760, 150, -18);
  },
  slotBack(c) {
    polaroidBack(c, "#fffcf8");
  },
  slotFront({ g, w, h, index }) {
    drawSticker(g, "sparkle", w / 2 - 16, -h / 2 + 14, index % 2 ? 86 : 104, 0);
    if (index % 2 === 0) drawSticker(g, "heart", -w / 2 + 22, h / 2 - 40, 64, -14);
  },
};

/* ------------------------------------------------------------------ 6. Classic Blue */

const NAVY = "#17306b";

function pearl(g: G, x: number, y: number, r: number) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, "#ffffff");
  gr.addColorStop(0.55, "#f1f4fa");
  gr.addColorStop(1, "#c4cfe4");
  g.save();
  g.shadowColor = "rgba(23,48,107,0.28)";
  g.shadowBlur = 4;
  g.shadowOffsetY = 2;
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** One line-art bloom, like the motifs on blue-and-white porcelain. */
function toileBloom(g: G, x: number, y: number, r: number, rot: number, color: string) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.strokeStyle = color;
  g.lineWidth = 2.6;
  g.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * Math.PI) / 3);
    g.beginPath();
    g.ellipse(0, -r * 0.56, r * 0.27, r * 0.5, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(0, -r * 0.3);
    g.lineTo(0, -r * 0.78);
    g.stroke();
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  g.stroke();
  for (const sgn of [-1, 1]) {
    g.beginPath();
    g.moveTo(0, r * 1.02);
    g.quadraticCurveTo(sgn * r * 0.7, r * 1.15, sgn * r * 0.78, r * 1.62);
    g.quadraticCurveTo(sgn * r * 0.2, r * 1.5, 0, r * 1.02);
    g.stroke();
  }
  g.restore();
}

const classicBlue: FrameArt = {
  background({ g, bg }) {
    const deep = mix(NAVY, bg, 0.1);
    g.fillStyle = mix(bg, "#ffffff", 0.55);
    g.fillRect(0, 0, W, H);

    // Porcelain-toile wallpaper: staggered line-art blooms and little diamonds.
    const rnd = mulberry32(77);
    const ink = rgba(mix(NAVY, bg, 0.25), 0.2);
    for (let j = -1; j < 12; j++) {
      for (let i = -1; i < 7; i++) {
        const x = i * 200 + (j % 2 ? 100 : 0) + 20;
        const y = j * 178;
        toileBloom(g, x, y, 54 + rnd() * 10, (rnd() - 0.5) * 0.9, ink);
        g.save();
        g.fillStyle = ink;
        g.translate(x + 100, y + 89);
        g.rotate(Math.PI / 4);
        g.fillRect(-7, -7, 14, 14);
        g.restore();
      }
    }

    // Calm the pattern inside the frame.
    g.fillStyle = "rgba(255,255,255,0.42)";
    rr(g, 64, 64, W - 128, H - 128, 26);
    g.fill();

    // Navy double border with a row of pearls between the lines.
    g.lineJoin = "round";
    g.strokeStyle = deep;
    g.lineWidth = 14;
    rr(g, 34, 34, W - 68, H - 68, 42);
    g.stroke();
    g.lineWidth = 3;
    rr(g, 64, 64, W - 128, H - 128, 26);
    g.stroke();
    for (let x = 96; x <= W - 96; x += 36) {
      pearl(g, x, 49, 7);
      pearl(g, x, H - 49, 7);
    }
    for (let y = 96; y <= H - 96; y += 36) {
      pearl(g, 49, y, 7);
      pearl(g, W - 49, y, 7);
    }

    drawSticker(g, "blue-peony", 975, 135, 250, 10);
    drawSticker(g, "blue-hydrangea", 140, 1775, 290, -6);
    drawSticker(g, "blue-blossom", 955, 1790, 240, 14);
    drawSticker(g, "blue-daisy", 108, 118, 190, -14);
    drawSticker(g, "blue-butterfly", 990, 880, 150, 22);
    drawSticker(g, "blue-heart", 100, 1000, 100, -12);
    drawSticker(g, "blue-sparkles", 800, 1690, 160, 0);
    drawSticker(g, "blue-sparkles", 330, 1700, 120, 10);
  },
  slotBack(c) {
    const { g, w, h, bg } = c;
    const deep = mix(NAVY, bg, 0.1);
    g.save();
    softShadow(g, 26, 12, 0.24);
    g.fillStyle = "#ffffff";
    rr(g, -w / 2, -h / 2, w, h, 10);
    g.fill();
    g.restore();
    g.strokeStyle = deep;
    g.lineWidth = 5;
    rr(g, -w / 2 + 11, -h / 2 + 11, w - 22, h - 22, 6);
    g.stroke();
    g.strokeStyle = rgba(deep, 0.55);
    g.lineWidth = 2;
    rr(g, -w / 2 + 24, -h / 2 + 24, w - 48, h - 48, 4);
    g.stroke();
    // Diamond studs at the corners of the inner line.
    g.fillStyle = deep;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      g.save();
      g.translate(sx * (w / 2 - 24), sy * (h / 2 - 24));
      g.rotate(Math.PI / 4);
      g.fillRect(-5.5, -5.5, 11, 11);
      g.restore();
    }
  },
  slotFront({ g, w, h, index }) {
    if (index % 2 === 0) drawSticker(g, "blue-bow", -w / 2 + 34, -h / 2 + 28, 170, -14);
    else drawSticker(g, "blue-bow", w / 2 - 34, h / 2 - 26, 160, 12);
  },
};

export const FRAME_ART: Record<FrameId, FrameArt> = {
  coquette,
  kawaii,
  "love-notes": loveNotes,
  "pink-picnic": pinkPicnic,
  "pink-memories": pinkMemories,
  "classic-blue": classicBlue,
};
