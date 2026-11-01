"use client";

import { useRouter } from "next/navigation";
import { FrameCard } from "./FrameCard";
import { useSession } from "./SessionProvider";
import { FRAMES } from "@/lib/frame-config";

/** The frame collection on the landing page. Choosing one jumps straight to the camera. */
export function HomeFrames() {
  const router = useRouter();
  const { frameId, setFrame } = useSession();

  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
      {FRAMES.map((f) => (
        <FrameCard
          key={f.id}
          frame={f}
          selected={false}
          chooseLabel={frameId === f.id ? "Use again" : "Use this"}
          onSelect={() => {
            setFrame(f.id);
            router.push("/camera/");
          }}
        />
      ))}
    </div>
  );
}
