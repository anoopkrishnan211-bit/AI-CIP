import { Check } from "lucide-react";
import type { StepId } from "@/types/career";

const steps: Array<{ id: StepId; label: string }> = [
  { id: "profile", label: "You" },
  { id: "resume", label: "Resume" },
  { id: "assessment", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "reasoning", label: "Intelligence" },
  { id: "report", label: "Career Report" },
];

export function ProgressRail({ active }: { active: StepId }) {
  const activeIndex = steps.findIndex((step) => step.id === active);
  if (active === "welcome") return null;

  return (
    <nav aria-label="Journey progress" className="overflow-x-auto pb-2">
      <ol className="flex min-w-[620px] items-center">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const current = step.id === active;
          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid size-8 place-items-center rounded-full border text-xs font-extrabold ${
                    complete || current
                      ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  {complete ? <Check size={15} /> : index + 1}
                </span>
                <span className="text-[11px] font-bold text-[var(--muted)]">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`mx-2 h-px flex-1 ${
                    complete ? "bg-[var(--teal)]" : "bg-[var(--line)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
