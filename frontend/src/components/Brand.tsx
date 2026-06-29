import { AniraMark } from "./AniraMark";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <AniraMark className="size-11 shrink-0 drop-shadow-sm" />
      <div>
        <div className="text-base font-black tracking-[0.22em] text-[var(--navy)]">
          ANIRA
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
          Career Intelligence Platform
        </div>
      </div>
    </div>
  );
}
