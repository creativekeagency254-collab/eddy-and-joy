'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/types';

interface ProductStarRatingProps {
  productId: string;
}

export default function ProductStarRating({ productId }: ProductStarRatingProps) {
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products', productId, 'reviews') : null),
    [firestore, productId]
  );
  const { data: reviews, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

  const { averageRating, reviewCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    const totalRating = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return {
      averageRating: totalRating / reviews.length,
      reviewCount: reviews.length,
    };
  }, [reviews]);
  
  const roundedAverage = Math.round(averageRating);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => {
            const ratingValue = i + 1;
            return (
              <Star
                key={ratingValue}
                className={cn(
                  'w-5 h-5',
                  ratingValue <= roundedAverage
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                )}
              />
            );
          })}
        </div>
        {!isLoadingReviews && (
          <span className="text-sm text-gray-500 hover:underline">
            {reviewCount > 0 ? `(${reviewCount} Reviews)` : '(No reviews yet)'}
          </span>
        )}
         {isLoadingReviews && (
            <span className="text-sm text-gray-400 animate-pulse">Loading...</span>
         )}
      </div>
      {averageRating > 0 && !isLoadingReviews && (
        <p className="text-sm font-medium text-gray-700">
          Average: {averageRating.toFixed(1)} / 5
        </p>
      )}
    </div>
  );
}
