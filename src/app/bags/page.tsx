'use client';

import { useState, useEffect } from 'react';
import ProductCard from "@/components/product/product-card";
import BagsEditorialHighlight from '@/components/product/bags-editorial-highlight';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { collection, query, where, getDocs, limit, startAfter, orderBy, DocumentData, DocumentSnapshot, Query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryTabs from '@/components/product/category-tabs';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 8;

export default function BagsPage() {
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("All");

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
      let q: Query<DocumentData> = query(collection(firestore, 'products'), where('category', '==', 'Bags'));

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
      setProducts(currentProducts => {
        const combined = isNewQuery ? newProducts : [...currentProducts, ...newProducts];
        combined.sort((a, b) => a.name.localeCompare(b.name));
        return combined;
      });
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
      <BagsEditorialHighlight />

      <div className="border-t pt-6">
        <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-6">
          {isLoading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)}
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
           {!isLoading && products.length === 0 && <p>No products found in this category.</p>}
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
