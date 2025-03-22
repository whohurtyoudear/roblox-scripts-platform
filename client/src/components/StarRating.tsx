import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  readOnly = false,
  onChange,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverRating(index);
  };
  
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };
  
  const handleClick = (index: number) => {
    if (readOnly) return;
    if (onChange) {
      onChange(index);
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        
        return (
          <Star
            key={index}
            size={size}
            className={`cursor-${readOnly ? 'default' : 'pointer'} transition-colors ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-400'
            } ${!readOnly && 'hover:text-yellow-300'}`}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;