# Pink Petal — Mini Photobooth

*A little frame. A lot of florals.*

A photobooth that runs entirely in the browser. Take photos with your phone or laptop camera, drop them into
pretty frames, add stickers and a note, then download the finished strip as a PNG or JPG.

- **No backend, no database, no account, no paid APIs.** Photos never leave the device.
- **Static site** (`next export`), deployable for free on GitHub Pages.
- **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · lucide-react.**

---

## How it works

| Step | Page | What happens |
| --- | --- | --- |
| 1 | `/` | Landing page with a frame collection and an About section. |
| 2 | `/frames/` | Pick one of six frames. The choice drives the camera page, the editor and the final image. |
| 3 | `/camera/` | `getUserMedia` live preview, 3 / 5 / 10 s countdown, 3 / 4 / 5 shots, retake one or all. |
| 4 | `/editor/` | Frames, layouts, background color, stickers, notes, which shot goes in which window. |
| 5 | `/result/` | The real 1080 × 1920 artwork, **Download PNG / JPG**, Share (where supported), Make another. |

Photos live in memory (a React context plus `Blob` object URLs), so you can move back and forth between pages
without losing them. A refresh starts a new session by design, because nothing is saved to disk.

Only lightweight preferences (last frame, countdown, photo count) go to `localStorage`.

### One renderer for everything

Frames, stickers, text and photos are all drawn by the same Canvas code in `lib/canvas-renderer.ts`:

- the frame cards and the landing-page preview,
- the live editor preview,
- the exported file (`scale = 1` → 1080 × 1920).

So the download matches the preview, and it is never a screenshot of the page. Selection handles are drawn only on the
preview and are never part of an export.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

`localhost` counts as a secure context, so the camera works in development.

```bash
npm run build        # static export → ./out
npm run preview      # serve ./out locally
npm run typecheck
```

---

## Deploy to GitHub Pages (free)

1. **Create a repository** on GitHub, e.g. `pink-petal` (public repos get Pages for free).
2. **Upload the project.** From this folder:
   ```bash
   git init
   git add .
   git commit -m "Pink Petal photobooth"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pink-petal.git
   git push -u origin main
   ```
3. **Enable Pages:** repository → **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
4. **Watch it build:** the **Actions** tab runs *Deploy to GitHub Pages* on every push to `main`
   (`.github/workflows/deploy.yml`). You can also start it by hand with *Run workflow*.
5. **Open your site:** `https://<your-username>.github.io/pink-petal/`
   (the finished URL is also shown on the deploy job).

### The base path

Project sites are served from `/<repo-name>/`, so every link and asset needs that prefix. This is automatic:

- The workflow sets `NEXT_PUBLIC_BASE_PATH=/<repo-name>` during the build
  (or an empty value if the repo is named `<user>.github.io`, which is served from the root).
- `next.config.ts` reads it for both `basePath` and `assetPrefix`.
- All navigation uses `next/link` / `useRouter`, which add the prefix on their own. There are no hard-coded asset paths:
  stickers and frames are generated in code, and fonts are bundled by `@fontsource`.

Renaming the repository needs no code change. Just push again.

### Refreshing and direct links

`trailingSlash: true` exports every route as `route/index.html`, so refreshing `/pink-petal/camera/` works on GitHub
Pages. `public/.nojekyll` stops Pages from ignoring the `_next` folder. Unknown URLs get `404.html`.

Opening `/editor/` or `/result/` directly (or refreshing them) shows a friendly "No photos yet" screen with a link to
the camera, because photos are intentionally not stored.

### Custom domain / other hosts

Leave `NEXT_PUBLIC_BASE_PATH` unset for a site served from the root (custom domain, Netlify, Cloudflare Pages, …) and
upload the `out/` folder.

---

## Camera notes

- Needs **HTTPS** (GitHub Pages provides it) or `localhost`. On plain `http://` the app explains this and offers uploads.
- Permission is requested only when you press **Turn on camera**. If the browser already remembers "allow", the preview
  starts by itself.
- The front camera is the default. The flip button (phones/tablets, or any device with 2+ cameras) switches to the rear
  camera, and the Camera menu lists every webcam on a laptop.
- Front-camera shots are mirrored, like the selfie preview you see.
- Camera streams are stopped when you leave the page, restart the camera, or hide the tab.
- Clear messages for: permission denied, no camera, camera busy, unsupported browser, insecure connection.
- **Fallback:** *Upload photos from your device* (multi-select `accept="image/*"`), plus *Use camera app*
  (`capture="environment"`) on touch devices. Handy for in-app browsers (Instagram, Facebook, …) that block cameras.

---

## Project structure

```
app/                      routes: / , /frames , /camera , /editor , /result  (+ icon.svg, globals.css)
components/               Header, Footer, FrameCard, FramePreview(+Modal), CameraStudio, CameraPreview,
                          Countdown, PhotoGrid, PhotoEditor, DecorationPanel, ResultView, DownloadButton,
                          SessionProvider (in-memory session state)
hooks/useCamera.ts        getUserMedia lifecycle, errors, device list, front/rear switching
lib/canvas-renderer.ts    compositing, hit-testing, selection handles
lib/frame-config.ts       the six frames (names, palettes, padding, tilt)
lib/frame-art.ts          procedural artwork for each frame (gingham, lace, torn paper, glitter, porcelain toile, …)
lib/layouts.ts            Duo / Trio / Strip / Grid geometry
lib/stickers.ts           28 original SVG stickers (pink set + a classic-blue set) (inline, so nothing can 404)
lib/sticker-render.ts     rasterises stickers once, with a white die-cut outline
lib/photo-utils.ts        capture-from-video, file import, export + download helpers
lib/storage.ts            localStorage preferences only
.github/workflows/deploy.yml
```

Differences from the suggested structure in the brief: frames and stickers are generated in code (SVG strings and Canvas
drawing) instead of files under `public/frames|flowers|stickers|textures`. That means no broken image paths, no CORS,
nothing that breaks under a `basePath`, and transparency is preserved.

---

## Customising

- **A new sticker:** add an entry to `STICKERS` in `lib/stickers.ts` (any SVG with a `viewBox`, plus explicit `width`/`height`).
- **A new frame:** add a `FrameDef` in `lib/frame-config.ts` and a matching `FrameArt` in `lib/frame-art.ts`.
- **Colors:** `tailwind.config.ts` (`petal.*`).

---

## What has and hasn't been tested

Tested automatically in **desktop Chromium** with Chrome's *fake webcam* device, and an iPhone-sized touch viewport
(also Chromium): the whole flow (frames → camera → countdown → capture → retake → editor → result → PNG and JPG
downloads verified as 1080 × 1920 files), front/rear switching requests, camera tracks ending when leaving the page, all
camera error states, the upload fallback, refresh and direct-URL behavior, no horizontal scrolling at 390 px,
a clean console, and zero failed requests when served under a `/pink-petal/` sub-path.

**Not tested:** a real iPhone or Android phone (Safari/Chrome mobile camera behavior, real front/rear lenses), Firefox,
and the GitHub Actions workflow itself (its YAML is valid, but it needs a real repository to run). Please open the live
site on your own phone once after deploying and try the camera.
