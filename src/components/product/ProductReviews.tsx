'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Review as ReviewType, WithId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


const reviewSchema = z.object({
  userName: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name cannot be longer than 50 characters." }),
  rating: z.number().min(1, { message: "Please select a rating." }),
  comment: z.string().min(10, { message: "Review must be at least 10 characters." }).max(500, { message: "Review cannot be longer than 500 characters." }),
});

function ReviewCard({ review }: { review: WithId<ReviewType> }) {
  const date = review.createdAt ? (review.createdAt as Timestamp).toDate() : new Date();

  return (
    <div className="p-1 h-full">
      <div className="w-full h-full bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
        <div>
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                )}
              />
            ))}
          </div>
          <p className="text-gray-600 text-sm line-clamp-5">"{review.comment}"</p>
        </div>
        <div className="mt-4 text-right">
          <p className="font-semibold text-gray-900">{review.userName}</p>
          <p className="text-xs text-gray-500">{formatDistanceToNow(date, { addSuffix: true })}</p>
        </div>
      </div>
    </div>
  );
}

const StarRatingInput = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        onClick={() => onChange(ratingValue)}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Rate ${ratingValue} stars`}
                    >
                        <Star
                            className={cn(
                                "w-7 h-7 cursor-pointer transition-colors",
                                ratingValue <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default function ProductReviews({ productId }: { productId: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'products', productId, 'reviews'), orderBy('createdAt', 'desc')) : null,
    [firestore, productId]
  );
  const { data: reviews, isLoading: isLoadingReviews } = useCollection<ReviewType>(reviewsQuery);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      userName: "",
      rating: 0,
      comment: "",
    },
  });
  
  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Database Error",
            description: "Could not connect to the database.",
        });
        return;
    }
    
    const reviewData = {
        ...values,
        createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'products', productId, 'reviews'), reviewData)
        .then(() => {
            toast({
                title: "Review Submitted!",
                description: "Thank you for your feedback.",
            });
            form.reset({
                userName: '',
                rating: 0,
                comment: ''
            });
        }).catch((e: any) => {
            console.error("Error submitting review: ", e);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Could not submit your review. Please try again.",
            });
        });
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };
  
  const sortedReviews = useMemo(() => {
    return reviews ? [...reviews].sort((a, b) => ((b.createdAt as Timestamp)?.toMillis() || 0) - ((a.createdAt as Timestamp)?.toMillis() || 0)) : [];
  }, [reviews]);

  return (
    <div className="py-12 md:py-24 bg-white border border-gray-200 rounded-3xl mt-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-1 space-y-6 lg:sticky top-24">
            <h2 className="text-3xl font-bold text-gray-900">Share Your Thoughts</h2>
            <p className="text-gray-600">
                Your feedback helps us improve and assists other shoppers. Let us know what you think about this product!
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Rating</FormLabel>
                      <FormControl>
                        <StarRatingInput value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Review</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about your experience..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  <Send className="ml-2 h-4 w-4"/>
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">What Others Are Saying</h3>
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-4">
                {isLoadingReviews && Array.from({length: 3}).map((_, i) => (
                    <CarouselItem key={i} className="md:basis-1/2 pl-4 h-[280px]">
                         <div className="p-1 h-full">
                            <Skeleton className="h-full w-full rounded-2xl" />
                         </div>
                    </CarouselItem>
                ))}
                {!isLoadingReviews && sortedReviews.length === 0 && (
                    <div className="w-full text-center py-12 text-gray-500">
                        <p>Be the first to review this product!</p>
                    </div>
                )}
                <AnimatePresence>
                  {sortedReviews.map((review, i) => (
                    <CarouselItem key={review.id} className="md:basis-1/2 pl-4 h-[280px]">
                      <motion.div
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="h-full"
                      >
                        <ReviewCard review={review} />
                      </motion.div>
                    </CarouselItem>
                  ))}
                </AnimatePresence>
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}
