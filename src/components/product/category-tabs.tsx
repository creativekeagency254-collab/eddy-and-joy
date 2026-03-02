'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Style {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function CategoryTabs({ activeTab, setActiveTab }: CategoryTabsProps) {
  const firestore = useFirestore();
  const stylesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'styles') : null),
    [firestore]
  );
  const { data: stylesData, isLoading } = useCollection<Style>(stylesQuery);

  const categories = useMemo(() => {
    const sortedStyles = stylesData?.sort((a, b) => a.name.localeCompare(b.name)).map(s => s.name) || [];
    return ["All", ...sortedStyles];
  }, [stylesData]);


  return (
    <div className="py-4 overflow-x-auto">
      <div className="flex gap-2.5 pb-2">
        {isLoading && Array.from({length: 6}).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
        {!isLoading && categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={cn(
              "px-4 py-2 rounded-full border-none text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === category
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
