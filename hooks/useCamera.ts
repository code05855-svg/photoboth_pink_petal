"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle" // nothing requested yet
  | "starting" // waiting for permission / device
  | "ready" // live preview
  | "denied" // permission refused
  | "unavailable" // no camera found, or it is in use elsewhere
  | "unsupported" // no getUserMedia / not a secure context
  | "error";

export type Facing = "user" | "environment";

export interface CameraState {
  status: CameraStatus;
  /** Short heading for the problem panel. */
  title: string;
  message: string;
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  deviceId: string | null;
  facing: Facing;
  /** True when the live video should be shown mirrored (selfie view). */
  mirrored: boolean;
}

const INITIAL: CameraState = {
  status: "idle",
  title: "",
  message: "",
  stream: null,
  devices: [],
  deviceId: null,
  facing: "user",
  mirrored: true,
};

function describeError(err: unknown): { status: CameraStatus; title: string; message: string } {
  const name = (err as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return {
        status: "denied",
        title: "Camera access is off",
        message:
          "Camera access is blocked. Allow the camera for this site in your browser's address bar or settings, then try again.",
      };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { status: "unavailable", title: "No camera found", message: "We couldn't find a camera on this device." };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return {
        status: "unavailable",
        title: "Camera is busy",
        message: "Your camera is busy. Close other apps or tabs that are using it, then try again.",
      };
    default:
      return { status: "error", title: "Camera didn't start", message: "Something went wrong while starting the camera. Please try again." };
  }
}

export function cameraSupport(): { ok: boolean; message: string } {
  if (typeof window === "undefined") return { ok: true, message: "" };
  if (!window.isSecureContext)
    return { ok: false, message: "Camera access needs a secure (HTTPS) connection. Open this page with https:// to use your camera." };
  if (!navigator.mediaDevices?.getUserMedia)
    return { ok: false, message: "This browser can't access a camera. Try a recent version of Safari, Chrome, Edge or Firefox." };
  return { ok: true, message: "" };
}

/**
 * Owns the MediaStream. Always stops its tracks on unmount, on page hide and when restarting, so the
 * camera light never stays on after leaving the studio.
 */
export function useCamera() {
  const [state, setState] = useState<CameraState>(INITIAL);
  const streamRef = useRef<MediaStream | null>(null);
  const token = useRef(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const devices = all.filter((d) => d.kind === "videoinput");
      setState((s) => ({ ...s, devices }));
    } catch {
      /* labels/lists are a nicety, not a requirement */
    }
  }, []);

  const start = useCallback(
    async (opts: { deviceId?: string | null; facing?: Facing } = {}) => {
      const support = cameraSupport();
      if (!support.ok) {
        setState((s) => ({ ...s, status: "unsupported", title: "Camera not available here", message: support.message }));
        return false;
      }
      const my = ++token.current;
      stopTracks();
      setState((s) => ({ ...s, status: "starting", message: "", stream: null }));

      const facing = opts.facing ?? "user";
      const base = { width: { ideal: 1280 }, height: { ideal: 720 } };
      const attempts: MediaTrackConstraints[] = opts.deviceId
        ? [{ ...base, deviceId: { exact: opts.deviceId } }, base]
        : [{ ...base, facingMode: { ideal: facing } }, {}];

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;
      for (const video of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
          break;
        } catch (err) {
          lastErr = err;
          const n = (err as { name?: string })?.name;
          if (n === "NotAllowedError" || n === "SecurityError" || n === "NotReadableError") break; // retrying won't help
        }
      }

      if (my !== token.current) {
        stream?.getTracks().forEach((t) => t.stop()); // a newer start() superseded this one
        return false;
      }
      if (!stream) {
        const d = describeError(lastErr);
        setState((s) => ({ ...s, status: d.status, title: d.title, message: d.message, stream: null }));
        return false;
      }

      streamRef.current = stream;
      const settings = stream.getVideoTracks()[0]?.getSettings?.() ?? {};
      const actualFacing = (settings.facingMode as Facing | undefined) ?? (opts.deviceId ? undefined : facing);
      setState((s) => ({
        ...s,
        status: "ready",
        message: "",
        stream,
        deviceId: settings.deviceId ?? opts.deviceId ?? null,
        facing: actualFacing ?? "user",
        mirrored: actualFacing !== "environment",
      }));
      void refreshDevices(); // device labels become available once permission is granted
      return true;
    },
    [refreshDevices, stopTracks],
  );

  const stop = useCallback(() => {
    token.current++;
    stopTracks();
    setState((s) => ({ ...s, status: "idle", stream: null, message: "" }));
  }, [stopTracks]);

  const flip = useCallback(() => {
    const next: Facing = state.facing === "user" ? "environment" : "user";
    return start({ facing: next });
  }, [start, state.facing]);

  // Never leave the camera running.
  useEffect(() => {
    const onHide = () => {
      token.current++;
      stopTracks();
      setState((s) => (s.status === "ready" ? { ...s, status: "idle", stream: null } : s));
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      token.current++;
      stopTracks();
    };
  }, [stopTracks]);

  // Keep the device list fresh when cameras are plugged in/out.
  useEffect(() => {
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.addEventListener) return;
    const handler = () => void refreshDevices();
    md.addEventListener("devicechange", handler);
    return () => md.removeEventListener("devicechange", handler);
  }, [refreshDevices]);

  return { ...state, start, stop, flip };
}
