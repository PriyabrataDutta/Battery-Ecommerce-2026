import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES } from "@/api/admin/orders";

export interface OrdersFilterState {
  search: string;
  status: string;
}

export function OrdersToolbar({
  state,
  onChange,
  count,
}: {
  state: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
  count: number;
}) {
  const set = <K extends keyof OrdersFilterState>(k: K, v: OrdersFilterState[K]) =>
    onChange({ ...state, [k]: v });
  const has = state.search || state.status;

  return (
    <div className="bg-card border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by order #, name, email or phone"
          className="pl-8 h-9 text-sm"
        />
      </div>

      <Select
        value={state.status || "__all"}
        onValueChange={(v) => set("status", v === "__all" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[160px] text-xs capitalize">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All statuses</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs capitalize">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {has && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ search: "", status: "" })}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}

      <span className="text-xs text-muted-foreground ml-auto">{count} orders</span>
    </div>
  );
}
