'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    className="h-6 w-6"
  >
    <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .2c54.9 0 105.8 21.2 144.2 59.5 38.2 38.3 59.5 89.4 59.5 144.2 0 112.2-91.5 203.7-203.7 203.7-35.1 0-69.2-9-98.7-25.9l-7.1-4.2-73.3 19.3 19.7-71.5-4.5-7.4c-18.4-30.6-28.2-66.2-28.2-103.5 0-112.2 91.5-203.7 203.7-203.7zM223.9 150.1c-12.2 0-22.1 9.9-22.1 22.1v.1c0 12.2 9.9 22.1 22.1 22.1 6.1 0 11.6-2.5 15.6-6.5 3.9-3.9 6.5-9.4 6.5-15.6-.1-12.2-10-22.1-22.1-22.1zm53.8 141.2c-4.4-2.2-26.2-12.9-30.3-14.4-4.1-1.5-7.1-2.2-10.1 2.2s-11.4 14.4-14 17.3c-2.6 3-5.2 3.3-9.6 1.1-4.4-2.2-18.6-6.9-35.4-21.8-13-11.7-21.8-26.2-24.4-30.6-2.6-4.4-.3-6.9 1.9-9.1 2-2 4.4-5.2 6.6-7.8 2.2-2.6 3-4.4 1.5-7.4-1.5-3-10.1-24.3-13.8-33.3-3.7-8.9-7.5-7.7-10.1-7.8h-9.1c-2.6 0-7.1.3-10.9 4.4-3.8 4.1-14.6 14.3-14.6 34.9 0 20.6 15 40.5 17.1 43.5 2.1 3 29.5 44.9 71.9 62.8 10.4 4.4 18.5 7.1 24.8 9.1 6.3 2 12.1 1.7 16.7.7 5.2-.9 26.2-10.7 29.9-21.1 3.7-10.4 3.7-19.3 2.6-21.1-1.1-1.9-4.1-3-8.5-5.2z" />
  </svg>
);


export default function WhatsAppChannelModal() {
  const [isOpen, setIsOpen] = useState(false);
  const promoImage = PlaceHolderImages.find(p => p.id === 'women-editorial-hero');


  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem('whatsappModalSeen');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('whatsappModalSeen', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 flex flex-col justify-center">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <span className="bg-green-100 p-2 rounded-full text-green-600">
                         <WhatsAppIcon />
                        </span>
                        Join Our Community
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        Get exclusive updates, new arrival alerts, and special offers directly on WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">Stay in the loop with the latest trends from Eddjos.ke. Join our channel for a first look at everything new!</p>
                </div>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button asChild variant="tactile-green" size="lg" className="w-full">
                        <Link href="https://www.whatsapp.com/channel/0029Vb6qjHpCHDyiWBPyKO2y" target="_blank">
                        Join WhatsApp Channel
                        </Link>
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </div>
            <div className="relative h-64 md:h-full hidden md:block">
               {promoImage && (
                 <Image
                    src={promoImage.imageUrl}
                    alt={promoImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={promoImage.imageHint}
                 />
               )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
