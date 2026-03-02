import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const collections = [
  {
    title: 'WOMEN',
    items: ['Dresses', 'Two-Piece Sets', 'Tops', 'Sweaters'],
    href: '/women',
    style: {},
    isImage: true,
    imageHint: 'marquee-women',
  },
  {
    title: 'UNISEX',
    items: ['Sweaters', 'Accessories', 'Casual Wear', 'Outerwear'],
    href: '/unisex',
    style: {},
    imageHint: 'marquee-unisex',
    isImage: true,
  },
  {
    title: 'MEN',
    items: ['T-Shirts & Polos', 'Official Shirts', 'Casual Shirts', 'Suits & Blazers'],
    href: '/men',
    style: {},
    isImage: true,
    imageHint: 'marquee-men',
  },
  {
    title: 'BAGS',
    items: ['Handbags', 'Backpacks', 'Totes', 'Clutches'],
    href: '/bags',
    style: {},
    isImage: true,
    imageHint: 'bag-editorial-large-replace',
  },
];

type CollectionCardProps = (typeof collections)[0];

const CollectionCard = ({ title, items, href, style, imageHint, isImage }: CollectionCardProps) => {
  const bgImage = PlaceHolderImages.find(p => p.id === imageHint);
  const cardStyle = isImage && bgImage
    ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.4), rgba(0,0,0,.9)), url(${bgImage.imageUrl})` }
    : style;

  return (
    <div
      style={cardStyle}
      className="w-[240px] h-[266px] rounded-[28px] p-6 text-white flex flex-col justify-between shrink-0 bg-center bg-cover"
    >
      <div>
        <h3 className="text-lg tracking-wider font-semibold">{title}</h3>
        <ul className="list-none p-0 my-3 space-y-1">
          {items.map(item => <li key={item} className="opacity-90 text-xs">{item}</li>)}
        </ul>
      </div>
      <Link href={href} passHref>
        <Button variant="secondary" className="rounded-full w-full">
          Explore {title}
        </Button>
      </Link>
    </div>
  );
};


export default function CollectionMarquee() {
  const allCards = [...collections, ...collections]; // Duplicate for seamless loop

  return (
    <section className="py-8 bg-transparent overflow-hidden">
      <div className="overflow-hidden w-full">
        <div className="flex w-max animate-scroll">
          {allCards.map((collection, index) => (
            <div key={`${collection.title}-${index}`} className="px-4">
                <CollectionCard {...collection} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
