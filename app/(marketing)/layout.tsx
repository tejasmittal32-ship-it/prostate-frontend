"use client";

import Link from "next/link";
import { Activity, Globe } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Deep Blue Navbar inspired by Gabbi */}
      <header className="w-full h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 md:px-16 z-50">
        <Link href="/" className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-[#0284c7]" />
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-serif tracking-widest">prostate ai<span className="text-[#0284c7]">.</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-600">
          <Link href="#" className="hover:text-slate-900 transition">About</Link>
          <Link href="#" className="hover:text-slate-900 transition">Partnerships</Link>
          <Link href="#" className="hover:text-slate-900 transition">For individuals</Link>
          <Link href="/login" className="hover:text-slate-900 transition ml-4">Sign in</Link>
          
          <Link 
            href="/onboarding" 
            className="px-5 py-2 text-white bg-[#0284c7] font-semibold rounded hover:bg-[#0369a1] transition-colors tracking-wide uppercase text-sm flex items-center gap-2"
          >
            Learn your risk
          </Link>

          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition ml-2">
            <Globe className="w-4 h-4" /> EN <span className="text-[10px]">▼</span>
          </button>
        </nav>
      </header>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
