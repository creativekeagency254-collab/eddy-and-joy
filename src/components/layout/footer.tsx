'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show admin button ONLY on the Bags page
  const isAdminVisible = isMounted && pathname === '/bags';

  return (
    <footer className="bg-background text-black pt-12 px-6 sm:px-12 lg:px-20 pb-[75px]">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Top Segment */}
        <div className="bg-white p-4 flex flex-col sm:flex-row justify-between items-center border-2 border-black rounded-2xl">
          <Link href="/" className="font-bold text-xl mb-4 sm:mb-0">Eddjos.ke</Link>
          <div className="flex items-center gap-4">
            <nav className="flex flex-wrap justify-center gap-x-5 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/women" className="hover:underline">Women</Link>
              <Link href="/men" className="hover:underline">Men</Link>
              <Link href="/unisex" className="hover:underline">Unisex</Link>
              <Link href="/bags" className="hover:underline">Bags</Link>
            </nav>
            {isAdminVisible && (
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin-dashboard">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Middle Segment */}
        <div className="bg-white p-4 border-2 border-black rounded-2xl">
          <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-200 max-h-[300px]">
            <iframe
              src="https://www.google.com/maps?q=Runda%20Mall,Nairobi&output=embed"
              loading="lazy"
              className="w-full h-full border-0"
              title="Eddjos Location"
            ></iframe>
          </div>
        </div>

        {/* Bottom Segment */}
        <div className="bg-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-2 border-black rounded-2xl">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Eddjos.ke. All rights reserved.</p>
          
          <Button asChild variant="secondary" size="icon" className="rounded-full">
              <Link href="/contact" aria-label="Contact page">
                <Phone size={20} />
              </Link>
          </Button>

          <div className="flex gap-4">
            <Link href="#" aria-label="Facebook" className="text-gray-600 hover:text-black"><Facebook size={20} /></Link>
            <Link href="#" aria-label="Twitter" className="text-gray-600 hover:text-black"><Twitter size={20} /></Link>
            <Link href="#" aria-label="Instagram" className="text-gray-600 hover:text-black"><Instagram size={20} /></Link>
            <Link href="#" aria-label="LinkedIn" className="text-gray-600 hover:text-black"><Linkedin size={20} /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}