"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CameraOff, ImagePlus, Loader2, RefreshCw, RotateCcw, SwitchCamera, Upload } from "lucide-react";
import { CameraPreview } from "./CameraPreview";
import { Countdown } from "./Countdown";
import { PhotoGrid } from "./PhotoGrid";
import { useSession } from "./SessionProvider";
import { useCamera } from "@/hooks/useCamera";
import { captureFromVideo, photoFromFile } from "@/lib/photo-utils";
import { getFrame } from "@/lib/frame-config";
import { cn } from "@/lib/cn";

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function CameraStudio() {
  const { frameId, countdown, setCountdown, photoCount, setPhotoCount, photos, activePhotos, hasAllPhotos, setPhoto, clearPhotos } =
    useSession();
  const cam = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<number | null>(null);

  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [shot, setShot] = useState<number | null>(null);
  const [flash, setFlash] = useState(0);
  const [notice, setNotice] = useState("");
  const [touch, setTouch] = useState(false);
  const cancelled = useRef(false);

  const ready = cam.status === "ready" && !!cam.stream;
  // When permission was already granted the preview starts by itself and the button's label changes
  // under the user's finger. Ignore a click that lands in that instant so it can't start a countdown.
  const readyAt = useRef(0);
  useEffect(() => {
    if (ready) readyAt.current = Date.now();
  }, [ready]);
  const filled = activePhotos.filter(Boolean).length;
  const frame = getFrame(frameId);

  useEffect(() => {
    // Phones and tablets: show the front/rear flip and the "camera app" option even before the browser has
    // listed every lens (iOS only lists them after permission). Detected by pointer type or a mobile user agent.
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setTouch(coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    return () => {
      cancelled.current = true; // stop any running countdown when leaving the page
    };
  }, []);

  // If the browser already remembers a "granted" permission, start the preview without an extra click.
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const status = await navigator.permissions?.query({ name: "camera" as PermissionName });
        if (!off && status?.state === "granted") void cam.start({ facing: "user" });
      } catch {
        /* Permissions API for the camera isn't available everywhere (e.g. Safari). The button still works. */
      }
    })();
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSequence = useCallback(
    async (indices: number[]) => {
      if (running || indices.length === 0) return;
      cancelled.current = false;
      setNotice("");
      setRunning(true);
      try {
        for (const idx of indices) {
          setShot(idx);
          for (let s = countdown; s > 0; s--) {
            if (cancelled.current) return;
            setCount(s);
            await sleep(1000);
          }
          if (cancelled.current) return;
          setCount(null);
          const video = videoRef.current;
          if (!video) throw new Error("no video");
          const photo = await captureFromVideo(video, cam.mirrored);
          setPhoto(idx, photo);
          setFlash((f) => f + 1);
          await sleep(900); // a short breather between shots
        }
      } catch {
        setNotice("We couldn't capture that photo. Check that the camera preview is live and try again.");
      } finally {
        setRunning(false);
        setCount(null);
        setShot(null);
      }
    },
    [running, countdown, cam.mirrored, setPhoto],
  );

  const cancel = () => {
    cancelled.current = true;
  };

  const onPrimary = async () => {
    if (ready && Date.now() - readyAt.current < 700) return;
    if (!ready) {
      await cam.start({ facing: "user" });
      return;
    }
    const missing = activePhotos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
    if (hasAllPhotos) {
      clearPhotos();
      void runSequence(Array.from({ length: photoCount }, (_, i) => i));
    } else void runSequence(missing);
  };

  const onRetake = (i: number) => {
    if (ready) void runSequence([i]);
    else {
      uploadTarget.current = i;
      fileRef.current?.click();
    }
  };

  const onFiles = async (files: FileList | null, target: number | null) => {
    if (!files || files.length === 0) return;
    setNotice("");
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setNotice("Please choose image files (JPG, PNG, HEIC…).");
      return;
    }
    const empty = activePhotos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
    const slots = target != null ? [target] : empty.length ? empty : Array.from({ length: photoCount }, (_, i) => i);
    try {
      for (let k = 0; k < Math.min(list.length, slots.length); k++) setPhoto(slots[k], await photoFromFile(list[k]));
    } catch {
      setNotice("We couldn't read that image. Try a different photo.");
    }
  };

  const primaryLabel = !ready ? "Turn on camera" : running ? "Taking photos…" : hasAllPhotos ? "Retake all" : filled > 0 ? "Take remaining shots" : "Start photo";
  const problem = ["denied", "unavailable", "unsupported", "error"].includes(cam.status);

  const actions = (
    <>
        {running ? (
          <button type="button" onClick={cancel} className="btn-white mt-4 w-full lg:mt-7 border border-petal-line">
            Cancel
          </button>
        ) : (
          <button type="button" onClick={onPrimary} disabled={cam.status === "starting"} className="btn-primary mt-4 w-full lg:mt-7">
            {cam.status === "starting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden />
            )}
            {primaryLabel}
          </button>
        )}

        {hasAllPhotos && !running ? (
          <Link href="/editor/" className="btn-soft mt-3 w-full">
            Continue to editor <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <p className="mt-3 text-center text-[12px] text-petal-muted">
            {filled === photoCount ? "" : `Take all ${photoCount} photos to continue.`}
          </p>
        )}

    </>
  );

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-9 lg:gap-y-8">
      {/* ------------------------------------------------ viewfinder + shots */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="rounded-[28px] bg-petal-plum p-3 sm:rounded-[32px] sm:p-[18px]">
          <div className="relative mx-auto aspect-[3/4] max-h-[76dvh] overflow-hidden rounded-[20px] bg-[#4a3b42] sm:aspect-[4/3] sm:rounded-[22px]">
            {ready && cam.stream && <CameraPreview ref={videoRef} stream={cam.stream} mirrored={cam.mirrored} />}

            {!ready && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                {cam.status === "starting" ? (
                  <div className="text-white">
                    <Loader2 className="mx-auto h-9 w-9 animate-spin text-petal-rose" />
                    <p className="mt-4 text-[15px] font-bold uppercase tracking-[0.04em]">Waiting for your camera…</p>
                    <p className="mt-1 text-[13px] text-petal-rose">Choose “Allow” when your browser asks.</p>
                  </div>
                ) : problem ? (
                  <div className="max-w-sm text-white" role="alert">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#664f59]">
                      <CameraOff className="h-7 w-7 text-petal-rose" />
                    </span>
                    <p className="mt-5 text-[15px] font-bold uppercase tracking-[0.04em]">{cam.title}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-petal-rose">{cam.message}</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      {cam.status !== "unsupported" && (
                        <button type="button" onClick={() => cam.start({ facing: "user" })} className="btn-primary !py-2.5">
                          <RefreshCw className="h-4 w-4" /> Try again
                        </button>
                      )}
                      <button type="button" onClick={() => fileRef.current?.click()} className="btn-white !py-2.5">
                        <Upload className="h-4 w-4" /> Upload photos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-white">
                    <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[#664f59] sm:h-40 sm:w-40">
                      <Camera className="h-10 w-10 text-petal-rose sm:h-14 sm:w-14" strokeWidth={1.5} />
                    </span>
                    <p className="mt-6 text-[15px] font-bold uppercase tracking-[0.04em]">Live camera preview</p>
                    <p className="mt-1 text-[13px] text-petal-rose">Your camera preview will appear here.</p>
                    <button type="button" onClick={() => cam.start({ facing: "user" })} className="btn-primary mt-5">
                      Turn on camera
                    </button>
                  </div>
                )}
              </div>
            )}

            {ready && count !== null && shot !== null && <Countdown value={count} shot={shot + 1} total={photoCount} />}
            {flash > 0 && <div key={flash} className="animate-flash pointer-events-none absolute inset-0 z-20 bg-white" aria-hidden />}

            {ready && !running && (touch || cam.devices.length > 1) && (
              <button
                type="button"
                onClick={() => cam.flip()}
                aria-label="Switch between front and back camera"
                className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-petal shadow-soft transition hover:scale-105"
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:hidden">{actions}</div>
        <div role="status" aria-live="polite" className={cn("mt-4 rounded-2xl bg-petal-mist px-4 py-3 text-[13px] text-petal", !notice && "hidden")}>
          {notice}
        </div>
        <p className="mt-4 text-[13px] text-petal-muted">Camera permission is requested only when you start. Photos stay in your browser.</p>

      </div>

      {/* ------------------------------------------------ controls */}
      <aside className="card h-fit p-6 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:sticky lg:top-6" aria-label="Photo settings">
        <h2 className="h-display text-[28px] font-bold">Your photo moment</h2>
        <p className="mt-1 text-[13px] text-petal-muted">
          Frame: <span className="font-bold text-petal">{frame.name}</span> ·{" "}
          <Link href="/frames/" className="underline decoration-petal-rose underline-offset-2 hover:text-petal">
            change
          </Link>
        </p>

        <div className="mt-6">
          <label htmlFor="cam-select" className="field-label">
            Camera
          </label>
          <div className="relative">
            <select
              id="cam-select"
              disabled={running || cam.status === "starting"}
              value={cam.devices.some((d) => d.deviceId === cam.deviceId) ? (cam.deviceId ?? "") : ""}
              onChange={(e) => (e.target.value ? cam.start({ deviceId: e.target.value }) : cam.start({ facing: "user" }))}
              className="w-full appearance-none rounded-2xl border border-petal-line bg-petal-mist px-4 py-3.5 pr-10 text-[15px] text-petal-ink disabled:opacity-60"
            >
              <option value="">Default camera</option>
              {cam.devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-petal-ink">
              ▼
            </span>
          </div>
        </div>

        <fieldset className="mt-6" disabled={running}>
          <legend className="field-label">Countdown</legend>
          <div className="flex flex-wrap gap-2.5">
            {([3, 5, 10] as const).map((n) => (
              <button key={n} type="button" aria-pressed={countdown === n} onClick={() => setCountdown(n)} className={countdown === n ? "pill-on" : "pill-off"}>
                {n} sec
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6" disabled={running}>
          <legend className="field-label">Photo strip</legend>
          <div className="flex flex-wrap gap-2.5">
            {([3, 4, 5] as const).map((n) => (
              <button key={n} type="button" aria-pressed={photoCount === n} onClick={() => setPhotoCount(n)} className={cn(photoCount === n ? "pill-on" : "pill-off", "!px-4")}>
                {n} photos
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[14px] text-petal-ink">
            {photoCount} shots <span className="mx-1 text-petal-muted">·</span> pick your favorites in the editor
          </p>
        </fieldset>

        <div className="hidden lg:block">{actions}</div>

        <p className="mt-4 text-center font-display text-[15px] italic text-petal-muted">Tip: face the light &amp; have fun!</p>


        <div className="mt-6 border-t border-petal-line pt-5">
          <p className="text-[13px] font-bold text-petal-ink">Camera not working?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-petal-muted">Upload photos from your device instead.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={running}
              onClick={() => {
                uploadTarget.current = null;
                fileRef.current?.click();
              }}
              className="btn-white !px-4 !py-2.5 border border-petal-line"
            >
              <Upload className="h-4 w-4" /> Upload photos
            </button>
            {touch && (
              <button
                type="button"
                disabled={running}
                onClick={() => {
                  uploadTarget.current = null;
                  captureRef.current?.click();
                }}
                className="btn-white !px-4 !py-2.5 border border-petal-line"
              >
                <ImagePlus className="h-4 w-4" /> Use camera app
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const t = uploadTarget.current;
            uploadTarget.current = null;
            void onFiles(e.target.files, t);
            e.target.value = "";
          }}
        />
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            void onFiles(e.target.files, null);
            e.target.value = "";
          }}
        />
      </aside>

        <section aria-labelledby="shots-h" className="min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="shots-h" className="h-display text-[26px] font-bold">
              Your shots <span className="text-petal-muted">({filled}/{photoCount})</span>
            </h2>
            <button
              type="button"
              disabled={running || filled === 0}
              onClick={() => {
                clearPhotos();
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-petal disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear all
            </button>
          </div>
          <PhotoGrid photos={activePhotos} busy={running} activeIndex={shot} onRetake={onRetake} />
        </section>
    </div>
  );
}
