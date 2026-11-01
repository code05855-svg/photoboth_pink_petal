import { hexToRgb, rgbToHex } from "./draw-utils";

/**
 * Original sticker artwork, authored as inline SVG so nothing can 404, nothing needs a basePath,
 * and transparency is preserved on the canvas. Each SVG carries explicit width/height because
 * Safari and Firefox need them to rasterise SVG images onto a canvas.
 */

export type StickerGroup = "flowers" | "cute" | "blue";

export interface StickerDef {
  id: string;
  label: string;
  group: StickerGroup;
  svg: string;
}

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">${inner}</svg>`;

const spin = (n: number, make: (angle: number, i: number) => string, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i * 360) / n;
    return `<g transform="rotate(${a} 100 100)">${make(a, i)}</g>`;
  }).join("");

/** Tiny five-petal flower used on branches and bouquets. */
const mini = (cx: number, cy: number, r: number, rot = 0, petal = "#ffc2d6", edge = "#f08fb0") =>
  `<g transform="rotate(${rot} ${cx} ${cy})">${Array.from({ length: 5 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return `<circle cx="${(cx + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.62).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${petal}" stroke="${edge}" stroke-width="1.2"/>`;
  }).join("")}<circle cx="${cx}" cy="${cy}" r="${(r * 0.26).toFixed(1)}" fill="#ffd966" stroke="#f0b429" stroke-width="1"/></g>`;

const starPoints = (cx: number, cy: number, R: number, r: number, n = 5) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const rad = i % 2 === 0 ? R : r;
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
  }).join(" ");

const HEART = "M100 176 C14 120 22 40 68 36 C90 34 100 54 100 62 C100 54 110 34 132 36 C178 40 186 120 100 176Z";
const SPARKLE = "M100 14 C106 70 130 94 186 100 C130 106 106 130 100 186 C94 130 70 106 14 100 C70 94 94 70 100 14Z";

const BOW_INNER = `
<defs><linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcade"/><stop offset="1" stop-color="#f06292"/></linearGradient></defs>
<path d="M96 104 C82 132 72 158 56 188 L86 178 L106 124Z" fill="#f48fb1" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M104 104 C118 132 128 158 144 188 L114 178 L94 124Z" fill="#f48fb1" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M100 100 C62 38 10 46 16 100 C10 154 62 162 100 100Z" fill="url(#bw)" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M100 100 C138 38 190 46 184 100 C190 154 138 162 100 100Z" fill="url(#bw)" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M50 76 C38 90 38 110 50 124" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3.5" stroke-linecap="round"/>
<path d="M150 76 C162 90 162 110 150 124" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3.5" stroke-linecap="round"/>
<rect x="85" y="83" width="30" height="34" rx="12" fill="#ec6c9b" stroke="#d63a73" stroke-width="2"/>
<path d="M93 92 C91 100 91 106 93 112" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;

export const STICKERS: StickerDef[] = [
  {
    id: "blossom",
    label: "Cherry blossom",
    group: "flowers",
    svg: wrap(`
<defs><radialGradient id="a" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="86"><stop offset="0" stop-color="#fff4f8"/><stop offset=".5" stop-color="#ffc9da"/><stop offset="1" stop-color="#f48fb1"/></radialGradient></defs>
${spin(5, () => `<path d="M100 104 C70 88 62 44 84 20 Q100 34 100 42 Q100 34 116 20 C138 44 130 88 100 104Z" fill="url(#a)" stroke="#e57ba0" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/><path d="M100 98 L100 58" stroke="#f06292" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`)}
${spin(9, () => `<path d="M100 100 L100 74" stroke="#d6457a" stroke-width="1.8" stroke-linecap="round"/><circle cx="100" cy="72" r="3.2" fill="#ffd966" stroke="#e0a21a" stroke-width=".8"/>`, 10)}
<circle cx="100" cy="100" r="7" fill="#e0457f"/>`),
  },
  {
    id: "peony",
    label: "Peony",
    group: "flowers",
    svg: wrap(`
${spin(9, () => `<ellipse cx="100" cy="54" rx="27" ry="46" fill="#f9c4d6" stroke="#f19ab8" stroke-width="1.4"/>`)}
${spin(7, () => `<ellipse cx="100" cy="66" rx="23" ry="36" fill="#f6a8c4" stroke="#ea85a8" stroke-width="1.3"/>`, 20)}
${spin(6, () => `<ellipse cx="100" cy="76" rx="18" ry="26" fill="#f08cb0" stroke="#e0699a" stroke-width="1.2"/>`, 10)}
<circle cx="100" cy="100" r="17" fill="#d94a82"/>
<path d="M90 98 C92 88 108 88 110 99 C111 108 98 112 93 106" fill="none" stroke="#ffd1e1" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`),
  },
  {
    id: "tulip",
    label: "Tulip",
    group: "flowers",
    svg: wrap(`
<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9db"/><stop offset="1" stop-color="#f06292"/></linearGradient></defs>
<path d="M100 104 C100 140 96 166 100 192" fill="none" stroke="#5fae64" stroke-width="6" stroke-linecap="round"/>
<path d="M100 192 C70 172 52 142 56 112 C84 128 98 156 100 192Z" fill="#8fcf8a" stroke="#5fae64" stroke-width="2" stroke-linejoin="round"/>
<path d="M100 192 C130 174 150 148 146 122 C120 136 102 162 100 192Z" fill="#74bd78" stroke="#5fae64" stroke-width="2" stroke-linejoin="round"/>
<path d="M58 52 C56 86 76 108 100 108 L100 36 C84 36 62 38 58 52Z" fill="#f48fb1" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M142 52 C144 86 124 108 100 108 L100 36 C116 36 138 38 142 52Z" fill="#f06292" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M100 20 C78 40 74 82 100 108 C126 82 122 40 100 20Z" fill="url(#t)" stroke="#e0457f" stroke-width="2" stroke-linejoin="round"/>
<path d="M92 48 C88 62 90 76 94 88" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`),
  },
  {
    id: "daisy",
    label: "Daisy",
    group: "flowers",
    svg: wrap(`
<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffdce7"/></linearGradient></defs>
${spin(14, () => `<ellipse cx="100" cy="52" rx="9.5" ry="35" fill="url(#d)" stroke="#f3a9c2" stroke-width="1.6"/>`)}
<circle cx="100" cy="100" r="19" fill="#ffd23f" stroke="#f2a900" stroke-width="2.4"/>
${[[93, 94], [106, 96], [98, 108], [109, 107], [92, 105]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#e69500" opacity=".7"/>`).join("")}`),
  },
  {
    id: "plumeria",
    label: "Plumeria",
    group: "flowers",
    svg: wrap(`
<defs><radialGradient id="p" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="88"><stop offset="0" stop-color="#ffd35c"/><stop offset=".22" stop-color="#fff1b8"/><stop offset=".45" stop-color="#fff7f9"/><stop offset=".8" stop-color="#ffc4d6"/><stop offset="1" stop-color="#f48fb1"/></radialGradient></defs>
${spin(5, () => `<path d="M100 100 C54 102 32 58 68 30 C104 12 130 56 100 100Z" fill="url(#p)" stroke="#ee9db9" stroke-width="1.4" stroke-linejoin="round"/>`)}
<circle cx="100" cy="100" r="6" fill="#ffcf4d"/>`),
  },
  {
    id: "watercolor",
    label: "Watercolor bloom",
    group: "flowers",
    svg: wrap(`
<defs>
<radialGradient id="w1"><stop offset="0" stop-color="#fde7ef" stop-opacity=".95"/><stop offset=".6" stop-color="#f7a8c4" stop-opacity=".8"/><stop offset="1" stop-color="#f48fb1" stop-opacity=".4"/></radialGradient>
<radialGradient id="w2"><stop offset="0" stop-color="#fff1f6" stop-opacity=".95"/><stop offset=".55" stop-color="#f48fb1" stop-opacity=".78"/><stop offset="1" stop-color="#e86a98" stop-opacity=".45"/></radialGradient>
</defs>
<ellipse cx="156" cy="158" rx="12" ry="32" transform="rotate(50 156 158)" fill="#b7d8ad" opacity=".75"/>
<ellipse cx="44" cy="156" rx="11" ry="28" transform="rotate(-48 44 156)" fill="#a9cf9f" opacity=".7"/>
${spin(6, () => `<ellipse cx="100" cy="58" rx="34" ry="50" fill="url(#w1)"/>`)}
${spin(5, () => `<ellipse cx="100" cy="70" rx="26" ry="38" fill="url(#w2)"/>`, 30)}
<circle cx="100" cy="100" r="15" fill="#f9d56e" opacity=".9"/>
${[[95, 96], [105, 98], [100, 106], [93, 105], [107, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#c2185b" opacity=".7"/>`).join("")}`),
  },
  {
    id: "branch",
    label: "Floral branch",
    group: "flowers",
    svg: wrap(`
<path d="M26 186 C70 152 104 112 170 26" fill="none" stroke="#8b6b55" stroke-width="4" stroke-linecap="round"/>
${[[52, 160, -30], [80, 134, 52], [108, 106, -34], [134, 78, 54], [60, 140, 60]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="7" transform="rotate(${a} ${x} ${y})" fill="#9ccc8f" stroke="#6fae69" stroke-width="1.4"/>`).join("")}
${mini(160, 44, 17, 0)}${mini(128, 86, 15, 20, "#ffd0e0")}${mini(92, 124, 13, 40)}${mini(58, 154, 11, 10, "#ffd0e0")}
<circle cx="182" cy="72" r="5" fill="#f9a8c4" stroke="#ee86ac" stroke-width="1.2"/><circle cx="150" cy="20" r="4" fill="#f9a8c4" stroke="#ee86ac" stroke-width="1.2"/>`),
  },
  {
    id: "bouquet",
    label: "Little bouquet",
    group: "flowers",
    svg: wrap(`
${[[58, 66], [102, 44], [146, 70]].map(([x, y]) => `<path d="M100 170 Q${(100 + x) / 2} ${(170 + y) / 2 + 10} ${x} ${y}" fill="none" stroke="#6fae69" stroke-width="4" stroke-linecap="round"/>`).join("")}
<ellipse cx="72" cy="112" rx="18" ry="7" transform="rotate(-50 72 112)" fill="#9ccc8f" stroke="#6fae69" stroke-width="1.4"/>
<ellipse cx="130" cy="114" rx="18" ry="7" transform="rotate(50 130 114)" fill="#9ccc8f" stroke="#6fae69" stroke-width="1.4"/>
${mini(58, 66, 27, 10, "#ffd0e0")}${mini(102, 44, 31, 0)}${mini(146, 70, 27, -10, "#ffc2d6")}
${[[24, 90], [180, 94], [36, 40], [170, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#f3b3c8" stroke-width="1.4"/>`).join("")}
<g transform="translate(100 172) scale(.42) translate(-100 -100)">${BOW_INNER}</g>`),
  },
  {
    id: "heart",
    label: "Glossy heart",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa3c3"/><stop offset="1" stop-color="#e91e63"/></linearGradient></defs>
<path d="${HEART}" fill="url(#h)" stroke="#d81b60" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="62" cy="64" rx="17" ry="9" transform="rotate(-38 62 64)" fill="#fff" opacity=".6"/>
<circle cx="86" cy="50" r="4" fill="#fff" opacity=".7"/>`),
  },
  {
    id: "hearts",
    label: "Heart trio",
    group: "cute",
    svg: wrap(`
<defs><path id="hh" d="${HEART}"/></defs>
<use href="#hh" transform="translate(-6 48) scale(.62)" fill="#f48fb1" stroke="#e0457f" stroke-width="4" stroke-linejoin="round"/>
<use href="#hh" transform="translate(98 6) scale(.46)" fill="#ffc2d6" stroke="#ee86ac" stroke-width="5" stroke-linejoin="round"/>
<use href="#hh" transform="translate(52 46) scale(.78)" fill="#ec407a" stroke="#c2185b" stroke-width="3.2" stroke-linejoin="round"/>
<ellipse cx="82" cy="84" rx="12" ry="6" transform="rotate(-38 82 84)" fill="#fff" opacity=".55"/>`),
  },
  {
    id: "star",
    label: "Smiley star",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3ec"/><stop offset="1" stop-color="#ff8fb4"/></linearGradient></defs>
<polygon points="${starPoints(100, 104, 80, 40)}" fill="url(#s)" stroke="#ff8fb4" stroke-width="16" stroke-linejoin="round"/>
<polygon points="${starPoints(100, 104, 80, 40)}" fill="none" stroke="#ffe3ec" stroke-width="4" stroke-linejoin="round" opacity=".7"/>
<circle cx="85" cy="104" r="4.5" fill="#5b2a3c"/><circle cx="115" cy="104" r="4.5" fill="#5b2a3c"/>
<path d="M92 116 Q100 125 108 116" fill="none" stroke="#5b2a3c" stroke-width="3.2" stroke-linecap="round"/>
<ellipse cx="76" cy="115" rx="7" ry="4.5" fill="#ff6f9f" opacity=".55"/><ellipse cx="124" cy="115" rx="7" ry="4.5" fill="#ff6f9f" opacity=".55"/>`),
  },
  {
    id: "sparkle",
    label: "Sparkle",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffb7c5"/></linearGradient></defs>
<path d="${SPARKLE}" fill="url(#k)" stroke="#f48fb1" stroke-width="4" stroke-linejoin="round"/>`),
  },
  {
    id: "sparkles",
    label: "Sparkle cluster",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="k2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffb7c5"/></linearGradient><path id="sp" d="${SPARKLE}"/></defs>
<use href="#sp" transform="translate(14 36) scale(.62)" fill="url(#k2)" stroke="#f48fb1" stroke-width="6" stroke-linejoin="round"/>
<use href="#sp" transform="translate(112 10) scale(.3)" fill="url(#k2)" stroke="#f48fb1" stroke-width="10" stroke-linejoin="round"/>
<use href="#sp" transform="translate(120 112) scale(.38)" fill="url(#k2)" stroke="#f48fb1" stroke-width="8" stroke-linejoin="round"/>
<use href="#sp" transform="translate(6 8) scale(.22)" fill="url(#k2)" stroke="#f48fb1" stroke-width="12" stroke-linejoin="round"/>`),
  },
  { id: "bow", label: "Satin bow", group: "cute", svg: wrap(BOW_INNER) },
  {
    id: "butterfly",
    label: "Butterfly",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="bf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd0e0"/><stop offset="1" stop-color="#f06292"/></linearGradient></defs>
<path d="M100 98 C70 36 14 26 18 78 C20 112 68 120 100 98Z" fill="url(#bf)" stroke="#c2185b" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M100 98 C130 36 186 26 182 78 C180 112 132 120 100 98Z" fill="url(#bf)" stroke="#c2185b" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M100 106 C74 112 40 132 54 166 C72 190 96 142 100 106Z" fill="#f48fb1" stroke="#c2185b" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M100 106 C126 112 160 132 146 166 C128 190 104 142 100 106Z" fill="#f48fb1" stroke="#c2185b" stroke-width="2.2" stroke-linejoin="round"/>
<circle cx="52" cy="70" r="8" fill="#fff" opacity=".7"/><circle cx="148" cy="70" r="8" fill="#fff" opacity=".7"/><circle cx="68" cy="144" r="5" fill="#fff" opacity=".65"/><circle cx="132" cy="144" r="5" fill="#fff" opacity=".65"/>
<ellipse cx="100" cy="104" rx="6" ry="36" fill="#6d2a44"/>
<path d="M97 70 C92 54 84 46 76 44 M103 70 C108 54 116 46 124 44" fill="none" stroke="#6d2a44" stroke-width="2.6" stroke-linecap="round"/>`),
  },
  {
    id: "strawberry",
    label: "Strawberry",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7d9b"/><stop offset="1" stop-color="#e0356a"/></linearGradient></defs>
<path d="M100 184 C48 158 34 102 50 78 C62 60 88 66 100 70 C112 66 138 60 150 78 C166 102 152 158 100 184Z" fill="url(#sb)" stroke="#c2185b" stroke-width="2.4" stroke-linejoin="round"/>
${[[72, 100], [98, 94], [126, 102], [84, 126], [112, 124], [98, 150], [64, 120], [138, 124], [76, 146], [124, 146], [100, 118]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4.6" transform="rotate(${i % 2 ? 12 : -12} ${x} ${y})" fill="#fff3d6" opacity=".92"/>`).join("")}
<ellipse cx="72" cy="86" rx="12" ry="6" transform="rotate(-30 72 86)" fill="#fff" opacity=".4"/>
<path d="M100 60 L100 36" stroke="#5fae64" stroke-width="5" stroke-linecap="round"/>
${[-64, -32, 0, 32, 64].map((a) => `<ellipse cx="100" cy="58" rx="10" ry="21" transform="rotate(${a} 100 72)" fill="#7bc47f" stroke="#5fae64" stroke-width="1.6"/>`).join("")}`),
  },
  {
    id: "camera",
    label: "Pink camera",
    group: "cute",
    svg: wrap(`
<defs><linearGradient id="cm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd0df"/><stop offset="1" stop-color="#f48fb1"/></linearGradient></defs>
<rect x="62" y="46" width="52" height="26" rx="9" fill="#f48fb1" stroke="#dc5c8a" stroke-width="3"/>
<rect x="26" y="62" width="148" height="106" rx="22" fill="url(#cm)" stroke="#dc5c8a" stroke-width="3.2"/>
<rect x="26" y="90" width="148" height="7" fill="#fff" opacity=".4"/>
<rect x="132" y="72" width="26" height="14" rx="5" fill="#fff8d9" stroke="#e4b94a" stroke-width="1.6"/>
<circle cx="100" cy="124" r="39" fill="#fff" stroke="#dc5c8a" stroke-width="4"/>
<circle cx="100" cy="124" r="29" fill="#5b3a4a"/><circle cx="100" cy="124" r="19" fill="#7a5468"/><circle cx="100" cy="124" r="8" fill="#a98298"/>
<circle cx="89" cy="112" r="7" fill="#fff" opacity=".75"/>
<path d="M48 150 C40 142 44 134 49 137 C52 131 60 135 55 142 L49 150Z" fill="#fff" opacity=".85" transform="translate(-2 4)"/>`),
  },
  {
    id: "tape",
    label: "Washi tape",
    group: "cute",
    svg: wrap(`
<defs><pattern id="tp" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="16" fill="#fff" opacity=".6"/></pattern></defs>
<path d="M24 66 L176 66 L168 76 L176 86 L168 96 L176 106 L168 116 L176 126 L24 126 L32 116 L24 106 L32 96 L24 86 L32 76Z" fill="#ffbcd2" opacity=".92"/>
<path d="M24 66 L176 66 L168 76 L176 86 L168 96 L176 106 L168 116 L176 126 L24 126 L32 116 L24 106 L32 96 L24 86 L32 76Z" fill="url(#tp)"/>
<path d="M24 66 L176 66 L168 76 L176 86 L168 96 L176 106 L168 116 L176 126 L24 126 L32 116 L24 106 L32 96 L24 86 L32 76Z" fill="none" stroke="#f48fb1" stroke-width="2" stroke-linejoin="round" opacity=".7"/>`),
  },
];


/* ------------------------------------------------------------------ classic blue set */

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Re-tint a pink sticker to classic blue: only pink/rose hues move; yellows, greens and whites stay put. */
function toBlue(svg: string) {
  return svg.replace(/#([0-9a-fA-F]{6})\b/g, (m, hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.1 || !(h >= 300 || h <= 12)) return m;
    const nh = 214 + (h >= 300 ? h - 360 : h) * 0.15;
    const [nr, ng, nb] = hslToRgb(nh, Math.min(1, s * 0.95), l);
    return rgbToHex(nr, ng, nb);
  });
}

const floret = (cx: number, cy: number, r: number, rot: number, fill: string) =>
  `<g transform="rotate(${rot} ${cx} ${cy})">${[0, 90, 180, 270]
    .map(
      (a) =>
        `<ellipse cx="${cx}" cy="${(cy - r * 0.55).toFixed(1)}" rx="${(r * 0.5).toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" transform="rotate(${a} ${cx} ${cy})" fill="${fill}" stroke="#5b8fd9" stroke-width="1.1"/>`,
    )
    .join("")}<circle cx="${cx}" cy="${cy}" r="${(r * 0.2).toFixed(1)}" fill="#fff6c9" stroke="#e0b94a" stroke-width=".8"/></g>`;

const HYDRANGEA = (() => {
  const palette = ["#bcd6f8", "#9cc0f2", "#7fa9ea", "#d3e3fc", "#a9c9f5"];
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 + 18) * Math.PI) / 180;
    pts.push([100 + Math.cos(a) * 62, 96 + Math.sin(a) * 62]);
  }
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60) * Math.PI) / 180;
    pts.push([100 + Math.cos(a) * 34, 96 + Math.sin(a) * 34]);
  }
  pts.push([100, 96]);
  return wrap(`
<ellipse cx="38" cy="156" rx="13" ry="32" transform="rotate(48 38 156)" fill="#9ccc8f" stroke="#6fae69" stroke-width="1.4"/>
<ellipse cx="164" cy="156" rx="13" ry="32" transform="rotate(-48 164 156)" fill="#8fc486" stroke="#6fae69" stroke-width="1.4"/>
${pts.map(([x, y], i) => floret(Math.round(x), Math.round(y), 19, (i * 23) % 90, palette[i % palette.length])).join("")}`);
})();

const BLUE_FROM: [string, string][] = [
  ["blossom", "Blue blossom"],
  ["peony", "Blue peony"],
  ["daisy", "Blue daisy"],
  ["bow", "Blue bow"],
  ["butterfly", "Blue butterfly"],
  ["heart", "Blue heart"],
  ["star", "Blue smiley star"],
  ["sparkles", "Blue sparkles"],
  ["tape", "Blue washi tape"],
];

STICKERS.push(
  { id: "blue-hydrangea", label: "Hydrangea", group: "blue", svg: HYDRANGEA },
  ...BLUE_FROM.map(([id, label]): StickerDef => ({
    id: `blue-${id}`,
    label,
    group: "blue",
    svg: toBlue(STICKERS.find((x) => x.id === id)!.svg),
  })),
);

export type StickerId = (typeof STICKERS)[number]["id"];

const BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export function getStickerDef(id: string) {
  return BY_ID.get(id);
}

const urlCache = new Map<string, string>();

/** data: URL for <img> thumbnails and for loading onto the canvas. */
export function stickerUrl(id: string): string {
  let url = urlCache.get(id);
  if (!url) {
    const def = BY_ID.get(id);
    url = def ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(def.svg)}` : "";
    urlCache.set(id, url);
  }
  return url;
}
