"use client";

import Link from "next/link";
import { Activity, Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/80 flex items-center justify-between px-6 sticky top-0 z-30 font-sans shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
          <Activity className="w-8 h-8 text-[#0284c7]" />
        </motion.div>
        <span className="text-xl font-bold tracking-tight text-slate-800 font-serif tracking-widest hidden sm:block">
          prostate ai<span className="text-[#38bdf8]">.</span>
        </span>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search patient ID, name, or report..." 
          className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 shadow-inner text-sm text-slate-700 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#38bdf8] focus:border-[#38bdf8] transition-all hover:bg-white"
        />
      </div>

      <div className="flex items-center gap-5">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative text-slate-500 hover:text-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
        </motion.button>
        <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100/50">
          Sign out
        </Link>
      </div>
    </header>
  );
}