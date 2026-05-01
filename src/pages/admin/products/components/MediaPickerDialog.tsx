import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ImageIcon, Check } from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  content_type: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** If true, allow picking multiple images. Otherwise single pick. */
  multiple?: boolean;
  onSelect: (urls: string[]) => void;
  /** URLs already selected (shown with checkmarks) */
  selected?: string[];
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  multiple = false,
  onSelect,
  selected = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["media_files_picker"],
    queryFn: async (): Promise<MediaFile[]> => {
      const { data, error } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, content_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaFile[];
    },
    enabled: open,
  });

  const filtered = search
    ? files.filter((f) => f.file_name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const toggle = (url: string) => {
    if (!multiple) {
      onSelect([url]);
      onOpenChange(false);
      return;
    }
    const next = new Set(picked);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setPicked(next);
  };

  const confirmMultiple = () => {
    onSelect(Array.from(picked));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {multiple ? "Select Images" : "Select Image"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mt-3">
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {search ? "No files match your search." : "No media files yet. Upload some in the Media Gallery first."}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {filtered.map((file) => {
                const isSelected = picked.has(file.file_url);
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => toggle(file.file_url)}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    {file.content_type?.startsWith("image/") ? (
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                      {file.file_name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="flex items-center justify-between pt-3 border-t border-line mt-3">
            <span className="text-xs text-muted-foreground">
              {picked.size} selected
            </span>
            <Button size="sm" onClick={confirmMultiple}>
              Confirm Selection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
