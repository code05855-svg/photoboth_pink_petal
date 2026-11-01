"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadBlob } from "@/lib/photo-utils";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  filename: string;
  /** Produces the final image. Called on click so JPG isn't encoded unless it's wanted. */
  getBlob: () => Promise<Blob>;
  disabled?: boolean;
  variant?: "primary" | "soft";
  onDone?: (format: string) => void;
  onError?: () => void;
}

export function DownloadButton({ label, filename, getBlob, disabled, variant = "primary", onDone, onError }: Props) {
  const [busy, setBusy] = useState(false);

  const click = async () => {
    setBusy(true);
    try {
      downloadBlob(await getBlob(), filename);
      onDone?.(filename.split(".").pop() ?? "");
    } catch {
      onError?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={click} disabled={disabled || busy} className={cn(variant === "primary" ? "btn-primary" : "btn-soft", "px-8")}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label}
    </button>
  );
}
