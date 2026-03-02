'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import CartSidebar from '@/components/cart/CartSidebar';
import UserNav from '@/components/layout/UserNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Header() {
  const path = usePathname();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 10) {
          setVisible(false);
        } else {
          setVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/men', label: 'Men' },
    { href: '/women', label: 'Women' },
    { href: '/unisex', label: 'Unisex' },
    { href: '/bags', label: 'Bags' },
  ];
  
  const getHeaderContainerClasses = () => {
    // On the server or before the component has mounted, we can't know the screen size,
    // so we default to the desktop "pill" style to avoid a hydration mismatch.
    if (!isMounted) return 'w-auto';
    // Once mounted, we can safely check if it's mobile and apply the full-width class.
    return isMobile ? 'w-full' : 'w-auto';
  };

  const getNavContainerClasses = () => {
    // Default to desktop styles on server and initial client render to avoid hydration mismatch.
    if (!isMounted) return 'flex-grow';
    // On mobile, remove flex-grow to allow cart button to be visible.
    return isMobile ? '' : 'flex-grow';
  }

  return (
    <header
      className={cn(
        'sticky top-4 z-50 flex justify-center transition-all duration-300 ease-in-out',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between bg-gray-100/80 backdrop-blur-sm p-1 rounded-full shadow-xl ring-1 ring-black ring-opacity-5 mx-4',
          getHeaderContainerClasses()
        )}
      >
        <div className={cn("overflow-x-auto no-scrollbar", getNavContainerClasses())}>
          <nav className="flex gap-2 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  path === item.href
                    ? 'bg-black text-white underline underline-offset-4'
                    : 'text-gray-700 hover:bg-gray-200'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="pr-2 flex items-center gap-2 flex-shrink-0">
          <CartSidebar />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
