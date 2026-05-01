import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ImageIcon, Check, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadItem {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number; // 0-100
  error?: string;
}

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  content_type: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  multiple?: boolean;
  onSelect: (urls: string[]) => void;
  selected?: string[];
}

const BUCKET = "media";

export function MediaPickerDialog({
  open,
  onOpenChange,
  multiple = false,
  onSelect,
  selected = [],
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

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

  const processFiles = useCallback(async (fileList: File[]) => {
    if (!fileList.length) return;
    setUploading(true);

    const items: UploadItem[] = fileList.map((f) => ({
      name: f.name,
      status: "pending" as const,
      progress: 0,
    }));
    setUploadItems([...items]);

    const updateItem = (idx: number, patch: Partial<UploadItem>) => {
      items[idx] = { ...items[idx], ...patch };
      setUploadItems([...items]);
    };

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        updateItem(i, { status: "uploading", progress: 10 });

        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${Date.now()}_${safeName}`;

          updateItem(i, { progress: 30 });

          const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type });
          if (uploadErr) throw uploadErr;

          updateItem(i, { progress: 70 });

          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

          const { error: dbErr } = await supabase.from("media_files").insert({
            file_name: file.name,
            file_url: urlData.publicUrl,
            bucket: BUCKET,
            path,
            size_bytes: file.size,
            content_type: file.type,
            uploaded_by: user?.id ?? null,
          });
          if (dbErr) throw dbErr;

          updateItem(i, { status: "done", progress: 100 });
          uploadedUrls.push(urlData.publicUrl);
        } catch (err: any) {
          updateItem(i, { status: "error", progress: 0, error: err.message ?? "Failed" });
        }
      }

      const successCount = items.filter((it) => it.status === "done").length;
      const failCount = items.filter((it) => it.status === "error").length;

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded${failCount ? `, ${failCount} failed` : ""}`);
        qc.invalidateQueries({ queryKey: ["media_files_picker"] });
        qc.invalidateQueries({ queryKey: ["media_files"] });

        if (!multiple && uploadedUrls.length === 1) {
          onSelect(uploadedUrls);
          onOpenChange(false);
        } else {
          const next = new Set(picked);
          uploadedUrls.forEach((u) => next.add(u));
          setPicked(next);
        }
      } else if (failCount > 0) {
        toast.error("All uploads failed");
      }
    } finally {
      setUploading(false);
      // Keep uploadItems visible briefly so user sees result, then clear
      setTimeout(() => setUploadItems([]), 3000);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [multiple, onOpenChange, onSelect, picked, qc, user?.id]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;
    processFiles(Array.from(selectedFiles));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (droppedFiles.length) processFiles(droppedFiles);
    else toast.error("Only image files are supported");
  }, [processFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {multiple ? "Select Images" : "Select Image"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Upload
          </Button>
        </div>
        {/* Upload progress panel */}
        {uploadItems.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 space-y-1.5">
            {uploadItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                {item.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                {item.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                {item.status === "pending" && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />}
                <span className="truncate flex-1 min-w-0" title={item.name}>{item.name}</span>
                <div className="w-20 shrink-0">
                  {(item.status === "uploading" || item.status === "pending") ? (
                    <Progress value={item.progress} className="h-1.5" />
                  ) : item.status === "error" ? (
                    <span className="text-destructive text-[10px]">Failed</span>
                  ) : (
                    <span className="text-green-600 text-[10px]">Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto min-h-0 mt-3 relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {dragging && (
            <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Upload className="h-10 w-10 text-primary animate-bounce" />
              <p className="text-sm font-medium text-primary">Drop images here to upload</p>
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {search ? "No files match your search." : "No media files yet. Drag & drop or click Upload to add images."}
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
