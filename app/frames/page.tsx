"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { FrameCard } from "@/components/FrameCard";
import { FramePreviewModal } from "@/components/FramePreviewModal";
import { useSession } from "@/components/SessionProvider";
import { StepHeading } from "@/components/StepHeading";
import { FRAMES, type FrameDef } from "@/lib/frame-config";

export default function FramesPage() {
  const { frameId, setFrame } = useSession();
  const [previewing, setPreviewing] = useState<FrameDef | null>(null);

  return (
    <div className="shell pb-10">
      <StepHeading eyebrow="Step 01 · The look" title="Pick your pretty frame.">
        Find the perfect frame for your photo strip. Choose one that feels like you.
      </StepHeading>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Frames">
        {FRAMES.map((f) => (
          <FrameCard
            key={f.id}
            frame={f}
            selected={f.id === frameId}
            onSelect={() => setFrame(f.id)}
            onPreview={() => setPreviewing(f)}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-5 sm:flex-row sm:items-center">
        <p className="text-center font-display text-[15px] italic text-petal-muted sm:text-left">
          You can change your frame and add stickers later ♡
        </p>
        <Link href="/camera/" className="btn-primary px-9">
          Continue to camera <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <FramePreviewModal
        frame={previewing}
        selected={previewing?.id === frameId}
        onClose={() => setPreviewing(null)}
        onChoose={(f) => setFrame(f.id)}
      />
    </div>
  );
}
