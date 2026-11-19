import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createReview, uploadReviewImage, addReviewImage } from "@/api/reviews";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

interface Props {
  productId: string;
  onClose: () => void;
}

export function WriteReviewForm({ productId, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (!user) {
    const returnUrl = encodeURIComponent(window.location.pathname);
    navigate(`/auth?next=${returnUrl}`);
    return null;
  }

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 3 - images.length);
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!body.trim()) { toast.error("Please write your review"); return; }

    setBusy(true);
    try {
      const reviewId = await createReview({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const url = await uploadReviewImage(images[i], user.id);
        await addReviewImage(reviewId, url, i);
      }

      toast.success("Review submitted! It will appear after moderation.");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["review-stats", productId] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface p-5 sm:p-6 space-y-4 mb-5">
      <h3 className="font-display-tight font-bold text-xl text-ink">Write a review</h3>

      <div>
        <label className="text-sm font-semibold block mb-1">Your Rating *</label>
        <StarRating rating={rating} onChange={setRating} size="md" interactive />
      </div>

      <div>
        <label className="text-sm font-semibold block mb-1">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={120}
        />
      </div>

      <div>
        <label className="text-sm font-semibold block mb-1">Your Review *</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share details about your experience with this product..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-sm font-semibold block mb-1">Photos (up to 3)</label>
        <div className="flex gap-2 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="relative w-20 h-20 border border-line rounded-xl overflow-hidden">
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove photo"
                className="absolute -top-1 -right-1 h-5 w-5 grid place-items-center bg-destructive text-white rounded-full text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <label className="w-20 h-20 border border-dashed border-line rounded-xl grid place-items-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => addImages(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : "Submit review"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
