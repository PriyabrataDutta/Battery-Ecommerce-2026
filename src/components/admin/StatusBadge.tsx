import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  // order_status
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  refunded: "bg-slate-100 text-slate-800 border-slate-200",
  // request_status
  new: "bg-sky-100 text-sky-800 border-sky-200",
  contacted: "bg-violet-100 text-violet-800 border-violet-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  // product status
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-rose-100 text-rose-800 border-rose-200",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "").toLowerCase();
  const tone = tones[s] ?? "bg-slate-100 text-slate-800 border-slate-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", tone)}>
      {status || "—"}
    </span>
  );
}
