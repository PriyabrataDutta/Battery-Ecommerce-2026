import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Copy, Trash2, Loader2, Search, Image as ImageIcon, X } from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  bucket: string;
  path: string;
  size_bytes: number | null;
  content_type: string | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET = "media";

const AdminMedia = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["media_files"],
    queryFn: async (): Promise<MediaFile[]> => {
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaFile[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: MediaFile) => {
      // Delete from storage
      const { error: storageErr } = await supabase.storage.from(file.bucket).remove([file.path]);
      if (storageErr) throw storageErr;
      // Delete from DB
      const { error: dbErr } = await supabase.from("media_files").delete().eq("id", file.id);
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      toast.success("File deleted");
      qc.invalidateQueries({ queryKey: ["media_files"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to delete"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;
    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        const ext = file.name.split(".").pop() ?? "";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${Date.now()}_${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });
        if (uploadErr) throw uploadErr;

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
      }
      toast.success(`${selectedFiles.length} file(s) uploaded`);
      qc.invalidateQueries({ queryKey: ["media_files"] });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = search
    ? files.filter((f) => f.file_name.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files…"
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

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} file{filtered.length !== 1 ? "s" : ""}
        </span>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1.5" />
          )}
          Upload Images
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-line rounded-md">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? "No files match your search." : "No media files yet. Upload some images to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group relative bg-card border border-line rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setPreview(file)}
            >
              <div className="aspect-square">
                {file.content_type?.startsWith("image/") ? (
                  <img
                    src={file.file_url}
                    alt={file.alt_text ?? file.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium truncate">{file.file_name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.size_bytes)}</p>
              </div>
              {/* Quick actions overlay */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(file.file_url);
                  }}
                  className="h-7 w-7 rounded bg-black/60 text-white grid place-items-center hover:bg-black/80"
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(file);
                  }}
                  className="h-7 w-7 rounded bg-destructive/80 text-white grid place-items-center hover:bg-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.file_name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden bg-muted max-h-[60vh] flex items-center justify-center">
                <img
                  src={preview.file_url}
                  alt={preview.alt_text ?? preview.file_name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">File size</p>
                  <p>{formatSize(preview.size_bytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Type</p>
                  <p>{preview.content_type ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Uploaded</p>
                  <p>{new Date(preview.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={preview.file_url}
                  className="text-xs h-9 font-mono"
                />
                <Button size="sm" variant="outline" onClick={() => copyUrl(preview.file_url)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.file_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the file from storage. Any pages referencing this URL will show a broken image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMedia;
