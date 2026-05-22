"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, Lock, Activity, ShieldCheck, ChevronRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* Dynamic Background Visuals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full opacity-60 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-100 blur-[120px] rounded-full opacity-60 mix-blend-multiply" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        
        <div className="mb-12 flex items-center gap-3">
          <Activity className="w-10 h-10 text-[#0284c7]" />
          <span className="text-3xl font-bold tracking-tight text-slate-900 font-serif tracking-widest">
            prostate ai<span className="text-[#0284c7]">.</span>
          </span>
        </div>

        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Clinical Access</h2>
          <p className="text-slate-500 mb-10 font-medium">Verify credentials to access diagnostic tools.</p>

          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div className="relative group">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0284c7] transition-colors" />
              <input 
                type="text" 
                autoComplete="off"
                placeholder="Institutional ID" 
                className="w-full bg-white border border-slate-300 rounded-xl px-12 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition-all shadow-sm"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#0284c7] transition-colors" />
              <input 
                type="password" 
                placeholder="Secure Password" 
                className="w-full bg-white border border-slate-300 rounded-xl px-12 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition-all shadow-sm"
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7] bg-white cursor-pointer" />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition">Keep session active</span>
              </label>
              <Link href="#" className="text-sm text-[#0284c7] hover:text-[#0369a1] font-semibold transition">
                Reset Keys
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 btn-3d-primary font-bold tracking-wide shadow-md"
            >
              {loading ? (
                <>Authenticating <span className="animate-pulse">...</span></>
              ) : (
                <>Initialize Session <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-500">
            For technical anomalies, please contact the IT dept<br/>or switch to the <Link href="/" className="text-[#0284c7] hover:underline font-semibold">Patient Portal</Link>.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-white flex-col justify-center items-center relative border-l border-slate-200">
         <div className="max-w-md px-10 text-center relative z-10">
           <ShieldCheck className="w-20 h-20 text-[#0284c7] mx-auto mb-6" />
           <h3 className="text-2xl font-bold text-slate-900 mb-4 font-serif">State-of-the-Art Precision</h3>
           <p className="text-slate-600 leading-relaxed">
             Our deterministic AI cluster boasts a 99.2% inference accuracy for critical tumor boundaries, streamlining your urology pipeline.
           </p>
         </div>
      </div>

    </div>
  );
}
