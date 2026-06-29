import { Sparkles } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--teal)] text-white">
        <Sparkles size={19} aria-hidden="true" />
      </span>
      <div>
        <div className="text-sm font-extrabold tracking-[0.2em]">ANIRA</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
          Career intelligence
        </div>
      </div>
    </div>
  );
}

