import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CategoriesToolbar({
  search,
  onSearch,
  onCreate,
  count,
}: {
  search: string;
  onSearch: (v: string) => void;
  onCreate: () => void;
  count: number;
}) {
  return (
    <div className="bg-card border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search categories"
          className="pl-8 h-9 text-sm"
        />
      </div>
      {search && (
        <Button variant="ghost" size="sm" onClick={() => onSearch("")}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
      <span className="text-xs text-muted-foreground ml-auto">{count} categories</span>
      <Button size="sm" onClick={onCreate}>
        New category
      </Button>
    </div>
  );
}
