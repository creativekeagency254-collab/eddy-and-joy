'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ShoppingBag, Heart } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isProductInWishlist } = useAppContext();

  const primaryImage = product.images?.[0] ?? {
    url: 'https://placehold.co/600x800',
    alt: 'Placeholder image',
    hint: 'placeholder',
  };
  
  const isInWishlist = isProductInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }

  return (
    <div className="relative group aspect-[4/5.5] rounded-2xl overflow-hidden border-2 border-black bg-gray-100 shadow-sm transition-all duration-500 hover:shadow-2xl">
      <Image
        src={primaryImage.url}
        alt={primaryImage.alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        data-ai-hint={primaryImage.hint}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Badge (Top Left) - Unblurred and Unbolded */}
      <div className="absolute top-5 left-5 z-20">
        <span className="bg-white/90 text-black text-[10px] font-medium px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg border border-white/50">
          {product.style || product.category}
        </span>
      </div>

      {/* Wishlist Button (Top Right) */}
      <button
        onClick={handleWishlistClick}
        className={cn(
          "absolute top-5 right-5 z-20 p-2.5 rounded-full transition-all shadow-xl bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40",
          isInWishlist ? "text-red-500" : "text-black"
        )}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} strokeWidth={2.5} />
      </button>

      {/* Main Link Overlay */}
      <Link 
        href={`/products/${product.slug}`} 
        className="absolute inset-0 z-10" 
        aria-label={`View ${product.name}`} 
      />

      {/* Info Bubble (Bottom) - 25% Transparency and Increased corner radius */}
      <div className="absolute bottom-5 left-5 right-5 z-20 bg-white/25 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between shadow-2xl border border-white/30">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-gray-800 text-sm font-medium lowercase truncate opacity-80">
            {product.name}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-black">
              Ksh {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-red-500 line-through font-medium opacity-80">
                Ksh {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCartClick}
          className="bg-black text-white p-3.5 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all pointer-events-auto"
        >
          <ShoppingBag size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
