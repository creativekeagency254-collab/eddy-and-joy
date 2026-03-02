'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const categories = [
  "All",
  "Small",
  "Big",
  "Luggage",
];

export default function BagsCategoryTabs() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="py-4 overflow-x-auto">
      <div className="flex gap-2.5 pb-2">
        {categories.map((category) => (
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
