'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useRef } from 'react';

export default function BagsEditorialHighlight() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x + 20}px`);
      card.style.setProperty('--mouse-y', `${y + 20}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const largeImage = PlaceHolderImages.find(p => p.id === 'bag-editorial-large-replace');
  const tallImage = PlaceHolderImages.find(p => p.id === 'stylish-crossbody-bag');
  const smallImage = PlaceHolderImages.find(p => p.id === 'minimalist-clutch');
  const wideImage = PlaceHolderImages.find(p => p.id === 'leather-duffle-bag');

  return (
    <section className="my-12">
      <div
        ref={cardRef}
        className="minimal-glow-card bg-white p-4 sm:p-8 rounded-3xl shadow-sm overflow-hidden"
        style={{ '--glow-card-radius': '1.5rem' } as React.CSSProperties}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Large Image (top-left) */}
          <div className="md:col-span-2 relative h-64 md:h-auto md:aspect-[1.7/1] rounded-2xl overflow-hidden group">
            {largeImage && (
                <Image
                    src={largeImage.imageUrl}
                    alt={largeImage.description}
                    fill
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={largeImage.imageHint}
                    sizes="(max-width: 768px) 100vw, 66vw"
                />
            )}
          </div>

          {/* Tall Image (top-right, spans 2 rows on md) */}
          <div className="md:row-span-2 relative h-96 md:h-auto rounded-2xl overflow-hidden group">
            {tallImage && (
              <Image
                src={tallImage.imageUrl}
                alt={tallImage.description}
                fill
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={tallImage.imageHint}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            )}
          </div>
          
          {/* Container for Small Image & Text (second row, left) */}
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative aspect-square w-full sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden group">
              {smallImage && (
                <Image
                  src={smallImage.imageUrl}
                  alt={smallImage.description}
                  fill
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={smallImage.imageHint}
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              )}
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-semibold mb-2">Season Highlight</h2>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Carefully curated fashion pieces designed with elegance,
                simplicity, and modern style in mind.
              </p>
            </div>
          </div>

          {/* Wide Image (bottom) */}
          <div className="md:col-span-3 relative h-56 rounded-2xl overflow-hidden group">
            {wideImage && (
              <Image
                src={wideImage.imageUrl}
                alt={wideImage.description}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={wideImage.imageHint}
                sizes="100vw"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
