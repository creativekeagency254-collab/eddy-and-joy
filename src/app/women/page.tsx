'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from "@/components/product/product-card";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import CategoryTabs from '@/components/product/category-tabs';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { collection, query, where, getDocs, limit, startAfter, DocumentData, DocumentSnapshot, Query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 8;

export default function WomenPage() {
  const [activeTab, setActiveTab] = useState("All");
  const heroImage = PlaceHolderImages.find(p => p.id === 'women-editorial-hero');

  const firestore = useFirestore();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (isNewQuery = false) => {
    if (!firestore) return;

    if (isNewQuery) {
      setIsLoading(true);
      setProducts([]);
      setLastVisible(null);
      setHasMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let q: Query<DocumentData> = query(collection(firestore, 'products'), where('category', '==', 'Women'));

      if (activeTab.toLowerCase() !== 'all') {
        q = query(q, where('style', '==', activeTab));
      }
      
      const cursor = isNewQuery ? null : lastVisible;
      if (cursor) {
        q = query(q, startAfter(cursor));
      }
      
      q = query(q, limit(PAGE_SIZE));

      const documentSnapshots = await getDocs(q);
      
      const newProducts = documentSnapshots.docs.map(doc => ({ ...(doc.data() as Product), id: doc.id }));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setHasMore(newProducts.length === PAGE_SIZE);
      setLastVisible(lastDoc || null);
      setProducts(currentProducts => (isNewQuery ? newProducts : [...currentProducts, ...newProducts]));
    } catch (error) {
      console.error("Error fetching products: ", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (firestore) {
      fetchProducts(true);
    }
  }, [firestore, activeTab]);

  return (
    <div className="space-y-6">
      <section className="relative rounded-2xl overflow-hidden h-96 flex items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative z-10 flex flex-col gap-6 items-center text-white p-8">
          <div>
            <p className="text-sm font-medium text-gray-300">Featured</p>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mt-1">New arrivals and editor picks</h1>
          </div>
          <p className="text-gray-200 max-w-2xl">
            Explore pieces that define the season. Carefully selected for contemporary elegance and expressive forms.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/women">
              <Button size="lg" variant="secondary" className="rounded-full">Explore Catalog</Button>
            </Link>
            <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
              Scroll <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t pt-6">
        <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-6">
          {isLoading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)}
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!isLoading && products.length === 0 && <p className="text-muted-foreground text-center col-span-full py-12">No products found for this selection.</p>}
        </div>
        <div className="flex justify-center mt-10">
          {hasMore && (
            <Button onClick={() => fetchProducts()} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
