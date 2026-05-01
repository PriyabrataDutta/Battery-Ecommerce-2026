import { useMemo, useState } from "react";
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

export interface UsersFilterState {
  search: string;
  role: string;
}

export function UsersToolbar({
  state,
  onChange,
  onInvite,
  count,
}: {
  state: UsersFilterState;
  onChange: (next: UsersFilterState) => void;
  onInvite: () => void;
  count: number;
}) {
  const set = <K extends keyof UsersFilterState>(k: K, v: UsersFilterState[K]) =>
    onChange({ ...state, [k]: v });
  const has = state.search || state.role;
  return (
    <div className="bg-card border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by name, email or phone"
          className="pl-8 h-9 text-sm"
        />
      </div>
      <Select
        value={state.role || "__all"}
        onValueChange={(v) => set("role", v === "__all" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[160px] text-xs capitalize">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All roles</SelectItem>
          <SelectItem value="admin" className="text-xs">Admin</SelectItem>
          <SelectItem value="staff" className="text-xs">Staff</SelectItem>
          <SelectItem value="customer" className="text-xs">Customer</SelectItem>
        </SelectContent>
      </Select>
      {has && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ search: "", role: "" })}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
      <span className="text-xs text-muted-foreground ml-auto">{count} users</span>
      <Button size="sm" onClick={onInvite}>
        Invite admin
      </Button>
    </div>
  );
}

/**
 * Pure helper: filter users on the client side. Kept exported for tests
 * and so the parent page stays tiny.
 */
export function useFilteredUsers<T extends { email: string; full_name: string | null; phone: string | null; roles: string[] }>(
  rows: T[],
  state: UsersFilterState,
) {
  return useMemo(() => {
    const term = state.search.trim().toLowerCase();
    return rows.filter((u) => {
      if (state.role && !u.roles.includes(state.role)) return false;
      if (!term) return true;
      return (
        u.email.toLowerCase().includes(term) ||
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, state.search, state.role]);
}

// Re-export the local state setter so consumers can construct an initial value.
export const EMPTY_USERS_FILTER: UsersFilterState = { search: "", role: "" };

// Avoid an unused-import lint when components don't use the hook directly.
void useState;
