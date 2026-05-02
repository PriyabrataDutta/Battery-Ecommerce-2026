import { Star } from "lucide-react";

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
  interactive?: boolean;
}

export function StarRating({ rating, onChange, size = "sm", interactive = false }: Props) {
  const px = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            className={`${px} transition-colors ${
              i <= rating ? "text-warning fill-warning" : "text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
