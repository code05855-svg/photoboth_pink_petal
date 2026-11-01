import { PhotoEditor } from "@/components/PhotoEditor";
import { StepHeading } from "@/components/StepHeading";

export default function EditorPage() {
  return (
    <div className="shell pb-6">
      <StepHeading eyebrow="Step 03 · Make it yours" title="A sprinkle of you.">
        Choose a frame, decorate your strip, and make it extra lovely.
      </StepHeading>
      <PhotoEditor />
    </div>
  );
}
