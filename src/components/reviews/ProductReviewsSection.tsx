import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProductReviews, useReviewStats } from "@/hooks/queries/useReviews";
import { StarRating } from "./StarRating";
import { WriteReviewForm } from "./WriteReviewForm";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  productId: string;
}

export function ProductReviewsSection({ productId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: stats } = useReviewStats(productId);
  const [showForm, setShowForm] = useState(false);

  const handleWriteReview = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/auth?next=${returnUrl}`);
      return;
    }
    setShowForm(true);
  };

  return (
    <div>
      {/* Summary */}
      <div className="surface p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          {stats && stats.count > 0 ? (
            <>
              <span className="font-display-tight text-5xl font-bold text-ink">
                {stats.avg.toFixed(1)}
              </span>
              <div>
                <StarRating rating={Math.round(stats.avg)} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {stats.count} review{stats.count !== 1 ? "s" : ""}
                </span>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>

        {!showForm && (
          <Button variant="outline" onClick={handleWriteReview}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Write a review
          </Button>
        )}
      </div>

      {showForm && (
        <WriteReviewForm productId={productId} onClose={() => setShowForm(false)} />
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-line bg-card/60 p-10 text-center text-sm text-muted-foreground">
          Be the first to review this product!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="surface p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.title && (
                    <h4 className="font-display font-bold text-sm text-ink mt-1">{review.title}</h4>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              {review.body && (
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{review.body}</p>
              )}

              {/* Review images */}
              {review.review_images && review.review_images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.review_images
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 border border-line rounded-xl overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line text-xs font-medium text-muted-foreground">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-muted"><User className="h-3 w-3" /></span>
                {(review.profiles as any)?.full_name || "Customer"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
