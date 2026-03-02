import type { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// This file is now deprecated for products. Data is fetched from Firestore.
export const products: Product[] = [];

export const getProductBySlug = (slug: string): Product | undefined => {
  console.warn("getProductBySlug is deprecated. Fetch data from Firestore instead.");
  return undefined;
};

export const getProductsByCategory = (category: 'women' | 'men' | 'children' | 'bags'): Product[] => {
    console.warn("getProductsByCategory is deprecated. Fetch data from Firestore instead.");
  return [];
}
