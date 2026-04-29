import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  pathPrefix?: string;
}

export function ImageUpload({ bucket, value, onChange, accept = "image/*", pathPrefix = "" }: Props) {
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${pathPrefix}${pathPrefix.endsWith("/") || pathPrefix === "" ? "" : "/"}${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Uploaded");
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-32 h-32 border border-line bg-white">
          <img src={value} alt="" className="w-full h-full object-contain p-2" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 h-6 w-6 grid place-items-center bg-primary text-white rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          className="h-10"
        />
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <Input
        placeholder="Or paste URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 text-xs"
      />
    </div>
  );
}
