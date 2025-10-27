import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({
  rating = 0,
  maxRating = 5,
  size = 20,
  showNumber = true,
  interactive = false,
  onChange = null,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(displayRating);
          const isHalfFilled = starValue === Math.ceil(displayRating) && displayRating % 1 !== 0;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              {isHalfFilled ? (
                <div className="relative">
                  <Star
                    size={size}
                    className="text-gray-300"
                    fill="currentColor"
                  />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                    <Star
                      size={size}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                  </div>
                </div>
              ) : (
                <Star
                  size={size}
                  className={isFilled ? 'text-yellow-400' : 'text-gray-300'}
                  fill={isFilled ? 'currentColor' : 'none'}
                />
              )}
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
