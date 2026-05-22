"use client";

import Link from "next/link";
import { Activity, Globe, ClipboardList, Stethoscope, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
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
            className="px-5 py-2 bg-[#0284c7] text-white font-medium rounded shadow-sm hover:bg-[#0369a1] transition-colors text-sm flex items-center gap-2"
          >
            Learn your risk
          </Link>

          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition ml-2">
            <Globe className="w-4 h-4" /> EN <span className="text-[10px]">▼</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative w-full py-32 flex flex-col items-center justify-center text-center overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-white to-white opacity-60"></div>
        <div className="relative z-10 max-w-4xl px-6">
          <h1 className="text-5xl md:text-7xl font-serif text-slate-800 leading-[1.1] mb-2 font-normal">
            Catch prostate cancer
          </h1>
          <h1 className="text-5xl md:text-7xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0284c7] to-indigo-600 mb-8 drop-shadow-sm tracking-tight">
            at the earliest stage.
          </h1>
          
          <div className="w-16 h-[1px] bg-sky-200 mx-auto mb-8" />
          
          <p className="text-xl md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-12 font-medium">
            Prostate AI partners with health systems, employers and providers to assess risk, directing patients to the proper clinical pathways.
          </p>

          <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
            <button className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium rounded shadow-sm transition-colors text-base">
              Partner with Prostate AI
            </button>
            <Link href="/onboarding" className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded shadow-sm transition-colors text-center inline-block text-base">
              Patient Risk Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="w-full bg-[#f8fafc] py-24 px-8 md:px-16 relative">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#0284c7] font-bold mb-6 uppercase tracking-wider text-sm">System Integration</p>
          <h2 className="text-3xl md:text-5xl font-serif text-slate-800 mb-20 leading-tight">
            Streamlining clinical diagnostics.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                  <ClipboardList className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Risk Assessment
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                Our clinically-validated online risk assessment allows men to learn their risk of prostate cancer and the factors driving it efficiently.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 shadow-sm">
                  <Stethoscope className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Expert Guidance
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                In a virtual visit, a urologist specializing in prostate health designs a standardized care plan integrated directly into existing EHR systems.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Diagnostic Results
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                Powered by deterministic AI models analyzing multi-parametric MRI sequences, physicians quickly evaluate actionable tissue risk factors.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
