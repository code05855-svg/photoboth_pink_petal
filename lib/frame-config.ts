import type { LayoutId } from "./layouts";

export type FrameId = "coquette" | "kawaii" | "love-notes" | "pink-picnic" | "pink-memories" | "classic-blue";

export interface FramePad {
  top: number;
  side: number;
  bottom: number;
}

export interface FrameDef {
  id: FrameId;
  name: string;
  tagline: string;
  description: string;
  /** Layout that shows this frame off best (used for the card preview and as the editor default). */
  layout: LayoutId;
  /** Starting background colour; the user can recolour it in the editor. */
  defaultBg: string;
  swatches: string[];
  /** Space between a cell's outer edge and the photo inside it. */
  pad: FramePad;
  /** Corner radius of the photo window. */
  radius: number;
  /** Tilt (degrees) applied to cells in order, repeating. */
  tilts: number[];
  /** Stickers this frame's artwork draws (preloaded before rendering). */
  ornaments: string[];
  /** Color of the placeholder photo windows. */
  accent: string;
  /** Default color for the caption text, chosen to suit the frame. */
  caption: string;
}

export const FRAMES: FrameDef[] = [
  {
    id: "coquette",
    name: "Coquette Lace",
    tagline: "Satin bows & lace",
    description: "Scalloped lace windows, gingham corners and love-letter script.",
    layout: "trio",
    defaultBg: "#F9D3DE",
    swatches: ["#F9D3DE", "#FFE4EA", "#F5C2D2", "#EBD9F5", "#FFF1E6", "#FFFFFF"],
    pad: { top: 46, side: 46, bottom: 46 },
    radius: 8,
    tilts: [-3, 2.5, -2.5, 3],
    ornaments: ["bow", "blossom", "peony", "sparkles", "camera", "heart"],
    accent: "#F28FB0",
    caption: "#B3154E",
  },
  {
    id: "kawaii",
    name: "Zarraaa Style",
    tagline: "Watercolor blooms",
    description: "Torn paper, soft watercolor washes and smiley polaroids.",
    layout: "duo",
    defaultBg: "#FFDCE7",
    swatches: ["#FFDCE7", "#FFE9D6", "#E8DAF8", "#D9F2E6", "#FFF6C9", "#FFFFFF"],
    pad: { top: 30, side: 30, bottom: 96 },
    radius: 4,
    tilts: [-4, 3.5, -3, 3],
    ornaments: ["watercolor", "plumeria", "star", "sparkles", "tape", "heart", "butterfly"],
    accent: "#F48FB1",
    caption: "#B3154E",
  },
  {
    id: "love-notes",
    name: "Love Notes",
    tagline: "Sweet heart details",
    description: "Notebook paper, a gingham border and tiny hand-drawn hearts.",
    layout: "strip",
    defaultBg: "#FFD3DF",
    swatches: ["#FFD3DF", "#FFE3EB", "#FAC5D6", "#E4D4F4", "#D3EEF7", "#FFFFFF"],
    pad: { top: 40, side: 40, bottom: 40 },
    radius: 14,
    tilts: [0, 0],
    ornaments: ["bow", "star", "hearts", "heart", "sparkle"],
    accent: "#EC6C9B",
    caption: "#B3154E",
  },
  {
    id: "pink-picnic",
    name: "Pink Picnic",
    tagline: "Gingham daydream",
    description: "A pink picnic blanket, white polaroids and ribbon bows.",
    layout: "duo",
    defaultBg: "#FFCFDC",
    swatches: ["#FFCFDC", "#FFE0E8", "#F8B7C9", "#FFE8C7", "#D6EBD2", "#FFFFFF"],
    pad: { top: 32, side: 32, bottom: 100 },
    radius: 3,
    tilts: [-5, 4.5, -4, 4],
    ornaments: ["strawberry", "daisy", "bow", "butterfly", "sparkles", "tulip"],
    accent: "#F06292",
    caption: "#B3154E",
  },
  {
    id: "pink-memories",
    name: "Pink Memories",
    tagline: "Glossy retro pop",
    description: "Glittery pink card, butterflies and a plumeria bloom.",
    layout: "trio",
    defaultBg: "#E6A9BF",
    swatches: ["#E6A9BF", "#F3B8CA", "#D88FAB", "#CDB4E8", "#F6C9A8", "#FBE3EC"],
    pad: { top: 30, side: 30, bottom: 88 },
    radius: 4,
    tilts: [-3, 3, -2.5, 2.5],
    ornaments: ["butterfly", "plumeria", "sparkles", "sparkle", "heart", "bow"],
    accent: "#E9709A",
    caption: "#B3154E",
  },
  {
    id: "classic-blue",
    name: "Classic Blue",
    tagline: "Porcelain & navy",
    description: "Delft-blue florals, a navy border, pearls and crisp white photo mats.",
    layout: "trio",
    defaultBg: "#D9E7FA",
    swatches: ["#D9E7FA", "#EAF1FC", "#BFD5F2", "#CFE6EE", "#E4E0F5", "#FFF6E4"],
    pad: { top: 46, side: 46, bottom: 46 },
    radius: 6,
    tilts: [-1.2, 1.2, -1, 1],
    ornaments: ["blue-bow", "blue-daisy", "blue-peony", "blue-hydrangea", "blue-blossom", "blue-sparkles", "blue-butterfly", "blue-heart"],
    accent: "#5B8FD9",
    caption: "#1F3A6E",
  },
];

export const getFrame = (id: FrameId | string): FrameDef => FRAMES.find((f) => f.id === id) ?? FRAMES[0];
export const isFrameId = (v: unknown): v is FrameId => FRAMES.some((f) => f.id === v);

/** Strips are short, so polaroid-style chins are slimmed to leave the photo window room to breathe. */
export function padFor(frame: FrameDef, layoutId: LayoutId): FramePad {
  const polaroid = frame.pad.bottom > frame.pad.top + 20;
  if (layoutId !== "strip" || !polaroid) return frame.pad;
  return { ...frame.pad, bottom: Math.max(frame.pad.top + 16, Math.round(frame.pad.bottom * 0.62)) };
}
