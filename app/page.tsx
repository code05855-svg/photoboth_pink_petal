import { CameraStudio } from "@/components/CameraStudio";
import { StepHeading } from "@/components/StepHeading";

export default function CameraPage() {
  return (
    <div className="shell pb-6">
      <StepHeading eyebrow="Step 02 · Say cheese" title="Ready, set, sparkle!">
        Allow camera access to see your best photo moments.
      </StepHeading>
      <CameraStudio />
    </div>
  );
}
