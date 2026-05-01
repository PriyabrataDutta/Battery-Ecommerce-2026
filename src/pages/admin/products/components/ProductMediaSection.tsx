import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, X, Star } from "lucide-react";
import { MediaPickerDialog } from "./MediaPickerDialog";

interface Props {
  featuredImage: string | null;
  onFeaturedChange: (url: string | null) => void;
  galleryImages: string[];
  onGalleryChange: (urls: string[]) => void;
}

/**
 * Featured image + gallery images section for the product editor.
 * Picks images from the media library (media_files table).
 */
export function ProductMediaSection({
  featuredImage,
  onFeaturedChange,
  galleryImages,
  onGalleryChange,
}: Props) {
  const [featuredPickerOpen, setFeaturedPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  const removeGalleryImage = (url: string) => {
    onGalleryChange(galleryImages.filter((u) => u !== url));
  };

  const handleGallerySelect = (urls: string[]) => {
    // Merge new selections with existing, avoiding duplicates
    const merged = Array.from(new Set([...galleryImages, ...urls]));
    onGalleryChange(merged);
  };

  return (
    <div className="space-y-4">
      {/* Featured image */}
      <div>
        <p className="text-xs font-medium mb-1.5">Featured Image</p>
        {featuredImage ? (
          <div className="relative inline-block">
            <img
              src={featuredImage}
              alt="Featured"
              className="h-32 w-32 object-cover rounded-md border border-line"
            />
            <button
              type="button"
              onClick={() => onFeaturedChange(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white grid place-items-center shadow"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-bold flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5" /> Featured
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFeaturedPickerOpen(true)}
            className="h-32 w-32 border-2 border-dashed border-line rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">Select image</span>
          </button>
        )}
        {featuredImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 text-xs h-7"
            onClick={() => setFeaturedPickerOpen(true)}
          >
            Change
          </Button>
        )}
      </div>

      {/* Gallery images */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium">
            Gallery Images
            {galleryImages.length > 0 && (
              <span className="text-muted-foreground ml-1">({galleryImages.length})</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {galleryImages.map((url, i) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                className="h-20 w-20 object-cover rounded border border-line"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(url)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white grid place-items-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setGalleryPickerOpen(true)}
            className="h-20 w-20 border-2 border-dashed border-line rounded flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[9px] font-medium">Add</span>
          </button>
        </div>
      </div>

      {/* Picker dialogs */}
      <MediaPickerDialog
        open={featuredPickerOpen}
        onOpenChange={setFeaturedPickerOpen}
        multiple={false}
        selected={featuredImage ? [featuredImage] : []}
        onSelect={(urls) => {
          if (urls.length > 0) onFeaturedChange(urls[0]);
        }}
      />
      <MediaPickerDialog
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        multiple
        selected={galleryImages}
        onSelect={handleGallerySelect}
      />
    </div>
  );
}
