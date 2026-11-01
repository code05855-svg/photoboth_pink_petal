import { ResultView } from "@/components/ResultView";
import { StepHeading } from "@/components/StepHeading";
import { Heart } from "lucide-react";

export default function ResultPage() {
  return (
    <div className="shell pb-6">
      <StepHeading
        eyebrow="Step 04 · Keep this moment"
        title={
          <>
            It’s giving main character <Heart className="inline h-[0.7em] w-[0.7em] -translate-y-[0.05em]" strokeWidth={1.8} aria-label="heart" />
          </>
        }
      >
        Your photo strip is ready in a pretty little package. Download your shot and keep it forever.
      </StepHeading>
      <ResultView />
    </div>
  );
}
