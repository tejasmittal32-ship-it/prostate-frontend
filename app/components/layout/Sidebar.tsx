"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileDigit, Users, BarChart3, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: Activity },
    { name: "New Scan", href: "/assessment", icon: FileDigit },
    { name: "Patient History", href: "/history", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] bg-white/40 backdrop-blur-xl border-r border-white/60 p-4 flex flex-col font-sans hidden md:flex sticky top-16 shadow-[2px_0_10px_rgba(0,0,0,0.01)]">
      <nav className="flex-1 space-y-2 mt-4 relative z-10">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className="block relative"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_10px_rgba(2,132,199,0.08)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 group ${
                isActive ? "text-[#0284c7]" : "text-slate-500 hover:text-slate-800"
              }`}>
                <motion.div 
                   whileHover={{ scale: 1.1 }} 
                   className={`${isActive ? "text-[#0284c7]" : "text-slate-400 group-hover:text-slate-600"}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="tracking-wide">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Hook */}
      <div className="pt-4 border-t border-slate-200/50 mt-auto">
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 px-4 py-2 bg-white/50 hover:bg-white rounded-xl cursor-pointer transition-all shadow-sm border border-transparent hover:border-slate-200/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#38bdf8] to-[#0284c7] border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-xs">
            TM
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Dr. Mittal</p>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Urology Dept</p>
          </div>
        </motion.div>
      </div>
    </aside>
  );
}