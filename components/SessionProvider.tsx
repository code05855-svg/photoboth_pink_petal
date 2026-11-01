"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Item } from "@/lib/canvas-renderer";
import { getFrame, type FrameId } from "@/lib/frame-config";
import { bestLayoutFor, getLayout, type LayoutId } from "@/lib/layouts";
import { newItemId, revokePhoto, type CapturedPhoto } from "@/lib/photo-utils";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/storage";

/** The camera always has room for 5 shots; `photoCount` says how many this session needs. */
export const MAX_PHOTOS = 5;

interface Session {
  frameId: FrameId;
  setFrame: (id: FrameId) => void;
  photoCount: 3 | 4 | 5;
  setPhotoCount: (n: 3 | 4 | 5) => void;
  countdown: 3 | 5 | 10;
  setCountdown: (n: 3 | 5 | 10) => void;

  photos: (CapturedPhoto | null)[];
  setPhoto: (index: number, photo: CapturedPhoto | null) => void;
  clearPhotos: () => void;
  /** Photos this session actually uses (first `photoCount`). */
  activePhotos: (CapturedPhoto | null)[];
  hasAllPhotos: boolean;

  layoutId: LayoutId;
  setLayout: (id: LayoutId) => void;
  /** For each slot of the layout, which captured photo it shows. */
  slotMap: number[];
  assignSlot: (slot: number, photoIndex: number) => void;

  bg: string;
  setBg: (c: string) => void;

  items: Item[];
  addSticker: (stickerId: string) => string;
  addText: (text: string, color: string, size: number) => string;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  bringToFront: (id: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  captionSeeded: boolean;
  seedCaption: () => void;

  /** Throw the session away (photos are released from memory). Preferences are kept. */
  reset: () => void;
}

const Ctx = createContext<Session | null>(null);

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession must be used inside <SessionProvider>");
  return s;
}

export const DEFAULT_CAPTION = "pink petal memories ♡";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [frameId, setFrameId] = useState<FrameId>("coquette");
  const [photoCount, setPhotoCountState] = useState<3 | 4 | 5>(3);
  const [countdown, setCountdownState] = useState<3 | 5 | 10>(3);
  const [photos, setPhotos] = useState<(CapturedPhoto | null)[]>(() => Array(MAX_PHOTOS).fill(null));
  const [layoutPref, setLayoutPref] = useState<LayoutId | null>(null);
  const [slotRaw, setSlotRaw] = useState<number[]>([]);
  const [bgOverride, setBgOverride] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captionSeeded, setCaptionSeeded] = useState(false);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Load lightweight preferences once the browser is available.
  useEffect(() => {
    const p = loadPrefs();
    setFrameId(p.frameId);
    setPhotoCountState(p.photoCount);
    setCountdownState(p.countdown);
  }, []);

  // Release photo memory if the tab is closed or the provider unmounts.
  useEffect(() => {
    return () => photosRef.current.forEach(revokePhoto);
  }, []);

  const prefsRef = useRef<Prefs>({ frameId: "coquette", countdown: 3, photoCount: 3 });
  prefsRef.current = { frameId, countdown, photoCount };
  const persist = useCallback((patch: Partial<Prefs>) => savePrefs({ ...prefsRef.current, ...patch }), []);

  const setFrame = useCallback(
    (id: FrameId) => {
      // Notes still in the old frame's caption color follow the new frame (the user's own colors are left alone).
      const from = getFrame(prefsRef.current.frameId).caption.toLowerCase();
      const to = getFrame(id).caption;
      setItems((prev) => prev.map((it) => (it.kind === "text" && it.color?.toLowerCase() === from ? { ...it, color: to } : it)));
      setFrameId(id);
      setBgOverride(null);
      setLayoutPref(null);
      setSlotRaw([]);
      persist({ frameId: id });
    },
    [persist],
  );
  const setPhotoCount = useCallback(
    (n: 3 | 4 | 5) => {
      setPhotoCountState(n);
      setSlotRaw([]);
      persist({ photoCount: n });
    },
    [persist],
  );
  const setCountdown = useCallback(
    (n: 3 | 5 | 10) => {
      setCountdownState(n);
      persist({ countdown: n });
    },
    [persist],
  );

  const setPhoto = useCallback((index: number, photo: CapturedPhoto | null) => {
    setPhotos((prev) => {
      const next = prev.slice();
      if (next[index] && next[index] !== photo) revokePhoto(next[index]);
      next[index] = photo;
      return next;
    });
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach(revokePhoto);
      return Array(MAX_PHOTOS).fill(null);
    });
    setSlotRaw([]);
  }, []);

  const frame = getFrame(frameId);
  const layoutId: LayoutId =
    layoutPref && getLayout(layoutPref).count <= photoCount ? layoutPref : bestLayoutFor(photoCount, frame.layout);
  const slotCount = getLayout(layoutId).count;

  const slotMap = useMemo(() => {
    const used = new Set<number>();
    return Array.from({ length: slotCount }, (_, i) => {
      const raw = slotRaw[i];
      let v = typeof raw === "number" && raw < photoCount && !used.has(raw) ? raw : -1;
      if (v < 0) {
        v = 0;
        while (used.has(v) && v < photoCount - 1) v++;
      }
      used.add(v);
      return v;
    });
  }, [slotRaw, slotCount, photoCount]);

  const setLayout = useCallback((id: LayoutId) => {
    setLayoutPref(id);
    setSlotRaw([]);
  }, []);

  const assignSlot = useCallback(
    (slot: number, photoIndex: number) => {
      const next = slotMap.slice();
      const other = next.indexOf(photoIndex);
      if (other >= 0 && other !== slot) next[other] = next[slot]; // swap so no photo is shown twice
      next[slot] = photoIndex;
      setSlotRaw(next);
    },
    [slotMap],
  );

  const addSticker = useCallback((stickerId: string) => {
    const id = newItemId();
    const jitter = (Math.random() - 0.5) * 90;
    setItems((prev) => [
      ...prev,
      { id, kind: "sticker", stickerId, x: 540 + jitter, y: 860 + jitter, size: 280, rotation: Math.round((Math.random() - 0.5) * 24) },
    ]);
    setSelectedId(id);
    return id;
  }, []);

  const addText = useCallback((text: string, color: string, size: number) => {
    const id = newItemId();
    setItems((prev) => [...prev, { id, kind: "text", text, color, size, x: 540, y: 1000, rotation: 0 }]);
    setSelectedId(id);
    return id;
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    setSelectedId(null);
  }, []);

  const bringToFront = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      return it ? [...prev.filter((i) => i.id !== id), it] : prev;
    });
  }, []);

  const seedCaption = useCallback(() => {
    setCaptionSeeded(true);
    setItems((prev) =>
      prev.length
        ? prev
        : [{ id: newItemId(), kind: "text", text: DEFAULT_CAPTION, color: getFrame(frameId).caption, size: 76, x: 540, y: 1772, rotation: 0 }],
    );
  }, [frameId]);

  const reset = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach(revokePhoto);
      return Array(MAX_PHOTOS).fill(null);
    });
    setItems([]);
    setSelectedId(null);
    setCaptionSeeded(false);
    setLayoutPref(null);
    setSlotRaw([]);
    setBgOverride(null);
  }, []);

  const activePhotos = useMemo(() => photos.slice(0, photoCount), [photos, photoCount]);
  const hasAllPhotos = activePhotos.every(Boolean);

  const value: Session = {
    frameId,
    setFrame,
    photoCount,
    setPhotoCount,
    countdown,
    setCountdown,
    photos,
    setPhoto,
    clearPhotos,
    activePhotos,
    hasAllPhotos,
    layoutId,
    setLayout,
    slotMap,
    assignSlot,
    bg: bgOverride ?? frame.defaultBg,
    setBg: setBgOverride,
    items,
    addSticker,
    addText,
    updateItem,
    removeItem,
    clearItems,
    bringToFront,
    selectedId,
    setSelectedId,
    captionSeeded,
    seedCaption,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
