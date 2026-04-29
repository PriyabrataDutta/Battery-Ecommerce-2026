import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function AdminPageHeader({
  title,
  count,
  search,
  onSearch,
  onCreate,
  createLabel = "New",
  actions,
}: {
  title: string;
  count?: number | string;
  search?: string;
  onSearch?: (v: string) => void;
  onCreate?: () => void;
  createLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display-tight font-bold text-xl">{title}</h2>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 flex items-center gap-2 md:justify-end">
        {onSearch && (
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-9"
            />
          </div>
        )}
        {actions}
        {onCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" /> {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
