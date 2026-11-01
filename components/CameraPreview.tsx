"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  stream: MediaStream;
  mirrored: boolean;
  className?: string;
}

/**
 * The live <video>. `playsInline` + `muted` + `autoPlay` are what let iOS Safari and Android Chrome
 * show the stream inline instead of going fullscreen or refusing to play.
 */
export const CameraPreview = forwardRef<HTMLVideoElement, Props>(function CameraPreview({ stream, mirrored, className }, ref) {
  const inner = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLVideoElement);

  useEffect(() => {
    const v = inner.current;
    if (!v) return;
    v.srcObject = stream;
    const play = () => v.play().catch(() => undefined);
    v.addEventListener("loadedmetadata", play);
    void play();
    return () => {
      v.removeEventListener("loadedmetadata", play);
      v.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={inner}
      autoPlay
      muted
      playsInline
      disablePictureInPicture
      aria-label="Live camera preview"
      className={cn("h-full w-full object-cover", mirrored && "-scale-x-100", className)}
    />
  );
});
