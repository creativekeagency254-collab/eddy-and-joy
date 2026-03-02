'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiRust,
  SiGo,
  SiPhp,
} from 'react-icons/si';
import { cn } from '@/lib/utils';
import { PT_Sans, Playfair_Display } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const AnimatedStat = ({ finalValue, label, suffix = '' }: { finalValue: number, label: string, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      let start = 0;
      const end = finalValue;
      if (start === end) return;

      const duration = 1500; // ms
      const range = end - start;
      let startTime: number | null = null;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * range + start);
        setCount(current);
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    animate(); // Initial animation

    return () => cancelAnimationFrame(animationFrameId);
  }, [finalValue]);


  return (
    <div className="bg-gray-50 p-6 rounded-2xl text-center shadow-inner">
      <p className={cn("text-5xl font-bold text-black", playfairDisplay.className)}>{count}{suffix}</p>
      <p className="text-xs uppercase tracking-wider text-gray-500 mt-2">{label}</p>
    </div>
  );
};


export default function ContactPage() {
  const devImage = PlaceHolderImages.find(p => p.id === 'developer-portrait-new');
  const services = [
    "Custom Web Application Development",
    "iOS & Android Mobile App Development",
    "Database Architecture & Integration",
    "API Design & Third-Party Integration",
    "Full-Stack Software Engineering",
    "UI/UX Strategy & Interactive Prototyping",
    "Responsive & Mobile-First Design",
    "SaaS Product Development",
    "E-commerce & Payment Gateway Integration",
    "Headless CMS Implementation",
    "AI & Machine Learning Model Integration",
    "Performance Optimization & Speed Audits",
    "Technical SEO & Web Vitals Management",
    "Cloud Infrastructure & DevOps (AWS/Vercel)",
    "Progressive Web App (PWA) Development",
    "Cybersecurity & Data Encryption Services",
    "Real-time WebSockets & Dashboard Analytics"
  ];
  const stats = [
    { value: 5, suffix: '+', label: 'Years of Experience' },
    { value: 99, suffix: '%', label: 'Satisfaction Clients' },
    { value: 80, suffix: '+', label: 'Clients on Worldwide' },
    { value: 100, suffix: '+', label: 'Projects Done' },
  ];

  return (
    <div className={cn("bg-white max-w-4xl mx-auto w-full rounded-3xl shadow-lg p-6 sm:p-12 relative", ptSans.className)}>
      
      <header className="mb-16 text-center md:text-left">
        <h1 className={cn("text-5xl md:text-6xl mb-2 text-black", playfairDisplay.className)}>Michael Muchemi</h1>
        <p className={cn("text-2xl md:text-3xl text-gray-700", playfairDisplay.className)}>Creative Developer</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          <div className="space-y-6 text-sm font-bold tracking-widest uppercase">
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-gray-400">Biography</h3>
                <p className="font-normal normal-case text-gray-600 mt-2 leading-relaxed">
                    A digital wizard who turns caffeine into code. I specialize in wrangling rogue semicolons and convincing computers to do my bidding.
                </p>
            </div>
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-gray-400">Contact</h3>
                <div className="space-y-1 mt-2 font-normal normal-case">
                    <p className="text-gray-600">Nairobi, Kenya</p>
                    <Link href="mailto:contact@eddjos.ke" className="text-black font-medium hover:underline block">contact@eddjos.ke</Link>
                    <Link href="tel:+254793832286" className="text-lg font-semibold text-black hover:underline block">+254 793 832286</Link>
                </div>
            </div>
            <div>
                <h3>Services</h3>
                <ul className="text-gray-600 font-normal normal-case space-y-1 mt-2">
                  {services.map(service => <li key={service}>{service}</li>)}
                </ul>
            </div>
          </div>
          
          <div className="flex justify-center order-first md:order-none">
              <Link href="tel:+254793832286" className="group" aria-label="Call the developer">
                <div className="w-64 h-80 rounded-full overflow-hidden flex items-end border-2 border-gray-100 shadow-inner transition-all duration-300 group-hover:shadow-lg group-hover:border-primary group-hover:scale-105">
                    {devImage ? (
                        <Image
                            src={devImage.imageUrl}
                            alt={devImage.description || 'Developer Portrait'}
                            width={256}
                            height={320}
                            className="w-full h-full object-cover object-top"
                            data-ai-hint={devImage.imageHint}
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200" />
                    )}
                </div>
              </Link>
          </div>

          {/* This empty div is for spacing on md+ screens */}
          <div className="hidden md:block"></div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
        {stats.map(stat => (
          <AnimatedStat key={stat.label} finalValue={stat.value} suffix={stat.suffix} label={stat.label} />
        ))}
      </div>


      <div className="mt-20 flex justify-center gap-x-8 md:gap-x-12 border-t border-gray-100 pt-10 text-zinc-400 grayscale hover:grayscale-0 transition-all duration-300">
          <SiJavascript size={32} title="JavaScript" className="hover:text-yellow-400" />
          <SiTypescript size={32} title="TypeScript" className="hover:text-blue-500" />
          <SiPython size={32} title="Python" className="hover:text-yellow-500" />
          <SiRust size={32} title="Rust" className="hover:text-orange-600" />
          <SiGo size={32} title="Go" className="hover:text-cyan-400" />
          <SiPhp size={32} title="PHP" className="hover:text-indigo-400" />
      </div>
    </div>
  );
}
