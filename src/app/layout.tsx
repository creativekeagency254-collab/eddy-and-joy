import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import WhatsAppChannelModal from "@/components/layout/WhatsAppChannelModal";
import { FirebaseClientProvider } from "@/firebase";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.eddjos.com'),
  title: {
    default: 'Eddjos Kenya - Stylish Clothing for Men, Women, Unisex, Children & Bags',
    template: '%s | Eddjos Kenya',
  },
  description:
    'Shop premium Kenyan clothing online at Eddjos. Explore men, women, unisex, children, and bags collections with modern style and nationwide delivery.',
  keywords: [
    'Kenyan clothing',
    'clothes in Kenya',
    'Nairobi fashion store',
    'men clothing Kenya',
    'women clothing Kenya',
    'unisex fashion Kenya',
    'bags Kenya',
    'Eddjos',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Eddjos Kenya - Stylish Clothing for Men, Women, Unisex, Children & Bags',
    description:
      'Shop premium Kenyan clothing online at Eddjos. Explore men, women, unisex, children, and bags collections.',
    url: 'https://www.eddjos.com',
    siteName: 'Eddjos',
    locale: 'en_KE',
    type: 'website',
    images: [
      {
        url: '/logo-cart.svg',
        width: 512,
        height: 512,
        alt: 'Eddjos Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eddjos Kenya - Stylish Clothing for Every Collection',
    description:
      'Discover Kenyan fashion for men, women, unisex, children, and bags at Eddjos.',
    images: ['/logo-cart.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo-cart.svg',
    shortcut: '/logo-cart.svg',
    apple: '/logo-cart.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Eddjos',
    url: 'https://www.eddjos.com',
    description:
      'Kenyan clothing and fashion store for men, women, unisex, children, and bags.',
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Eddjos',
    url: 'https://www.eddjos.com',
    logo: 'https://www.eddjos.com/logo-cart.svg',
    sameAs: [],
  };

  return (
    <html lang="en">
      <body
        className={cn(
          "bg-gray-50 font-sans"
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppProvider>
          <FirebaseClientProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="max-w-7xl mx-auto px-4 pb-4 pt-8 md:px-6 md:pb-6 md:pt-10 w-full flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
            <WhatsAppChannelModal />
          </FirebaseClientProvider>
        </AppProvider>
      </body>
    </html>
  );
}
