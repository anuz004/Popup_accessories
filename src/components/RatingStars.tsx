import { Star } from "lucide-react";

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={filled ? "fill-gold text-gold" : "text-white/20"}
            strokeWidth={1.5}
          />
        );
      })}
    </div>
  );
}
