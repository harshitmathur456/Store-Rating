import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value?: number | null;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StarRating({
  value = null,
  count,
  interactive = false,
  onChange,
  disabled = false,
  size = 'md',
  showLabel = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentVal = hoverRating !== null ? hoverRating : (value || 0);

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(currentVal);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || disabled}
              onClick={() => interactive && onChange && onChange(star)}
              onMouseEnter={() => interactive && !disabled && setHoverRating(star)}
              className={`p-0.5 transition-transform ${
                interactive && !disabled
                  ? 'hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded'
                  : 'cursor-default'
              }`}
              title={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
              aria-label={`${star} star`}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  filled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-zinc-100 text-zinc-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="text-[13px] font-medium text-zinc-700 ml-1">
          {value !== null && value !== undefined && value > 0 ? (
            <>
              <span className="font-semibold text-zinc-900">{value.toFixed(1)}</span>
              {count !== undefined && (
                <span className="text-zinc-400 font-normal ml-1">({count})</span>
              )}
            </>
          ) : (
            <span className="text-zinc-400 font-normal">No ratings yet</span>
          )}
        </span>
      )}
    </div>
  );
}
