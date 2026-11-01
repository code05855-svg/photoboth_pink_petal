"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Loader2, Share2 } from "lucide-react";
import { useSession } from "./SessionProvider";
import { DownloadButton } from "./DownloadButton";
import { EmptyPhotos } from "./PhotoEditor";
import { prepareComposition, renderComposition, type Composition } from "@/lib/canvas-renderer";
import { canvasToBlob, exportFileName, toPhotoSource } from "@/lib/photo-utils";
import { H, W } from "@/lib/draw-utils";

export function ResultView() {
  const { hasAllPhotos } = useSession();
  if (!hasAllPhotos) return <EmptyPhotos message="Take your photos and decorate your strip, then your finished artwork will appear here." />;
  return <ResultInner />;
}

function ResultInner() {
  const s = useSession();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jpgRef = useRef<Blob | null>(null);
  const pngRef = useRef<Blob | null>(null);

  const [status, setStatus] = useState<"rendering" | "ready" | "error">("rendering");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState("");

  // Draw the real 1080 × 1920 artwork once everything it needs has loaded.
  useEffect(() => {
    let off = false;
    let url: string | null = null;
    (async () => {
      try {
        const photos = await Promise.all(s.slotMap.map((pi) => (s.activePhotos[pi] ? toPhotoSource(s.activePhotos[pi]!) : Promise.resolve(null))));
        const comp: Composition = { frameId: s.frameId, layoutId: s.layoutId, bg: s.bg, photos, items: s.items };
        await prepareComposition(comp);
        if (off) return;
        const canvas = renderComposition(comp, 1);
        canvasRef.current = canvas;
        jpgRef.current = null;
        pngRef.current = await canvasToBlob(canvas, "image/png");
        if (off) return;
        url = URL.createObjectURL(pngRef.current);
        setPreviewUrl(url);
        setStatus("ready");
      } catch {
        if (!off) {
          setStatus("error");
          setError("We couldn't build your photo strip. Go back to the editor and try again.");
        }
      }
    })();
    return () => {
      off = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [s.slotMap, s.activePhotos, s.frameId, s.layoutId, s.bg, s.items]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function");
  }, []);

  const getPng = async () => {
    if (!pngRef.current) throw new Error("not ready");
    return pngRef.current;
  };
  const getJpg = async () => {
    if (!jpgRef.current && canvasRef.current) jpgRef.current = await canvasToBlob(canvasRef.current, "image/jpeg", 0.95);
    if (!jpgRef.current) throw new Error("not ready");
    return jpgRef.current;
  };

  const share = async () => {
    try {
      const blob = await getPng();
      const file = new File([blob], exportFileName("png"), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "My Pink Petal photo strip" });
      else setError("Sharing isn't supported here. Use Download instead.");
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") setError("Sharing didn't work. Use Download instead.");
    }
  };

  const makeAnother = () => {
    s.reset();
    router.push("/frames/");
  };

  const ready = status === "ready";

  return (
    <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)] lg:gap-14">
      <section className="card p-5 sm:p-8" aria-label="Your finished photo strip">
        <div
          className="relative mx-auto overflow-hidden rounded-[18px] bg-petal-mist shadow-[0_24px_50px_-26px_rgba(216,27,96,0.55)]"
          style={{ width: "min(100%, calc(72vh * 0.5625))", aspectRatio: `${W} / ${H}` }}
        >
          {previewUrl ? (
            // An <img> (not a canvas) so phones can long-press to save as well.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Your finished Pink Petal photo strip" width={W} height={H} className="block h-full w-full" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-petal" role="status">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.04em]">{status === "error" ? "Something went wrong" : "Making your strip…"}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="h-display text-[clamp(2.2rem,4.5vw,3.4rem)]">Made to be kept.</h2>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-petal-muted">
          PNG is the sharpest and keeps every detail. JPG makes a smaller file that’s easier to send.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <DownloadButton label="Download PNG" filename={exportFileName("png")} getBlob={getPng} disabled={!ready} onDone={(f) => setSaved(f.toUpperCase())} onError={() => setError("Couldn't save the file. Try again.")} />
          <DownloadButton label="Download JPG" variant="soft" filename={exportFileName("jpg")} getBlob={getJpg} disabled={!ready} onDone={(f) => setSaved(f.toUpperCase())} onError={() => setError("Couldn't save the file. Try again.")} />
          {canShare && (
            <button type="button" onClick={share} disabled={!ready} className="btn-white border border-petal-line">
              <Share2 className="h-4 w-4" /> Share
            </button>
          )}
        </div>

        <div role="status" aria-live="polite" className="mt-6 rounded-2xl border border-petal-line bg-petal-mist p-5">
          {error ? (
            <p className="text-[14px] font-bold text-petal">{error}</p>
          ) : saved ? (
            <>
              <p className="flex items-center gap-2 font-display text-[22px] font-bold italic text-petal">
                <Heart className="h-5 w-5" /> Saved with love!
              </p>
              <p className="mt-1 text-[14px] text-petal-muted">Your {saved} is in your downloads. It’s a full {W} × {H} image.</p>
            </>
          ) : ready ? (
            <>
              <p className="flex items-center gap-2 font-display text-[22px] font-bold italic text-petal">
                <Check className="h-5 w-5" /> Your strip is ready
              </p>
              <p className="mt-1 text-[14px] text-petal-muted">{W} × {H} pixels, with no buttons or menus, just your artwork.</p>
            </>
          ) : (
            <p className="text-[14px] text-petal-muted">Putting the finishing touches on your strip…</p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={makeAnother} className="btn-soft">
            Make another
          </button>
          <Link href="/editor/" className="link-arrow text-[14px]">
            Back to editor
          </Link>
          <Link href="/camera/" className="link-arrow text-[14px]">
            Retake photos
          </Link>
          <Link href="/frames/" className="link-arrow text-[14px]">
            Change frame
          </Link>
        </div>
      </section>
    </div>
  );
}
