/** Canvas can't use a webfont until it has actually loaded, so wait for it before drawing text. */
let loading: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve();
  if (!loading) {
    loading = Promise.all([
      document.fonts.load('italic 700 48px "Playfair Display"', "Aa"),
      document.fonts.load('italic 800 48px "Playfair Display"', "Aa"),
      document.fonts.load('700 28px "DM Sans Variable"', "AaYOUR PHOTO"),
    ])
      .then(() => document.fonts.ready)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return loading;
}
