import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/adminLog";
import { logActivity } from "@/lib/adminLog";

const BUCKETS = ["product-images", "brand-logos", "blog", "catalogs"] as const;

const Media = () => {
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>("product-images");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast.error(error.message);
    setFiles((data ?? []).filter((f: any) => f.name && !f.name.endsWith("/")));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bucket]);

  const upload = async (file: File) => {
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) toast.error(error.message);
    else { toast.success("Uploaded"); await logActivity("media.upload", "storage_object", `${bucket}/${path}`, { size: file.size }); load(); }
    setUploading(false);
  };

  const remove = async (name: string) => {
    if (!confirm("Delete this file?")) return;
    const { error } = await supabase.storage.from(bucket).remove([name]);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); await logActivity("media.delete", "storage_object", `${bucket}/${name}`); load(); }
  };

  const publicUrl = (name: string) => supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;

  return (
    <div>
      <h2 className="font-display-tight font-bold text-xl mb-4">Media Library</h2>
      <Tabs value={bucket} onValueChange={(v: any) => setBucket(v)}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <TabsList>{BUCKETS.map((b) => <TabsTrigger key={b} value={b}>{b}</TabsTrigger>)}</TabsList>
          <label className="inline-flex">
            <Button asChild size="sm" disabled={uploading}>
              <span className="cursor-pointer">{uploading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Uploading</> : <><Upload className="h-4 w-4 mr-1.5" /> Upload</>}</span>
            </Button>
            <input type="file" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>

        {BUCKETS.map((b) => (
          <TabsContent key={b} value={b} className="mt-0">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" /></div>
            ) : files.length === 0 ? (
              <div className="bg-card border border-line rounded-lg p-12 text-center text-muted-foreground text-sm">No files in this bucket.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {files.map((f) => {
                  const url = publicUrl(f.name);
                  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name);
                  return (
                    <div key={f.name} className="bg-card border border-line rounded-lg overflow-hidden group">
                      <div className="aspect-square bg-muted grid place-items-center overflow-hidden">
                        {isImage ? <img src={url} alt={f.name} className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground p-2 break-all">{f.name.split(".").pop()?.toUpperCase()}</span>}
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] truncate" title={f.name}>{f.name}</div>
                        <div className="text-[10px] text-muted-foreground">{formatBytes(f.metadata?.size ?? 0)}</div>
                        <div className="flex gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(url); toast.success("URL copied"); }}><Copy className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(f.name)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Media;
