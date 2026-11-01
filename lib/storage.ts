import { isFrameId, type FrameId } from "./frame-config";

/**
 * Lightweight preferences only. Photos are never written to storage: they live in memory
 * for the current session and are released when the session ends.
 */
const KEY = "pink-petal:prefs:v1";

export interface Prefs {
  frameId: FrameId;
  countdown: 3 | 5 | 10;
  photoCount: 3 | 4 | 5;
}

export const DEFAULT_PREFS: Prefs = { frameId: "coquette", countdown: 3, photoCount: 3 };

export function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      frameId: isFrameId(p.frameId) ? p.frameId : DEFAULT_PREFS.frameId,
      countdown: p.countdown === 5 || p.countdown === 10 ? p.countdown : 3,
      photoCount: p.photoCount === 4 || p.photoCount === 5 ? p.photoCount : 3,
    };
  } catch {
    return DEFAULT_PREFS; // storage blocked (private mode) — preferences simply won't persist
  }
}

export function savePrefs(prefs: Prefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
