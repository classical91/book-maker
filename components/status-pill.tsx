import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  DRAFT: "border-zinc-300 bg-zinc-100 text-zinc-700",
  OUTLINE_READY: "border-amber-300 bg-amber-100 text-amber-800",
  WRITING: "border-orange-300 bg-orange-100 text-orange-800",
  COMPLETE: "border-emerald-300 bg-emerald-100 text-emerald-800",
  OUTLINED: "border-stone-300 bg-stone-100 text-stone-700",
  BRIEF_READY: "border-blue-300 bg-blue-100 text-blue-800",
  DRAFTED: "border-orange-300 bg-orange-100 text-orange-800",
  REVIEWED: "border-violet-300 bg-violet-100 text-violet-800",
};

function formatLabel(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

export function StatusPill({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        compact && "px-2.5 py-0.5 text-[10px]",
        palette[status] || "border-zinc-300 bg-zinc-100 text-zinc-700",
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
