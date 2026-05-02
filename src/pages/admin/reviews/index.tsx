import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllReviews, updateReviewStatus, type ProductReview } from "@/api/reviews";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, User, Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const AdminReviews = () => {
  const [filter, setFilter] = useState<string>("all");
  const qc = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () => listAllReviews(filter === "all" ? undefined : filter),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      updateReviewStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated");
    },
    onError: () => toast.error("Failed to update review"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{reviews.length} reviews</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
          No reviews found.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={review.rating} size="sm" />
                    <Badge variant="secondary" className={statusColors[review.status] ?? ""}>
                      {review.status}
                    </Badge>
                  </div>
                  {review.title && (
                    <h4 className="font-display font-bold text-sm mt-1">{review.title}</h4>
                  )}
                  {review.body && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{review.body}</p>
                  )}

                  {/* Review images */}
                  {review.review_images && review.review_images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.review_images.map((img) => (
                        <a
                          key={img.id}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 border border-line rounded overflow-hidden"
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {(review.profiles as any)?.full_name || "Customer"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => mutation.mutate({ id: review.id, status: "approved" })}
                      disabled={mutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => mutation.mutate({ id: review.id, status: "rejected" })}
                      disabled={mutation.isPending}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
