"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleSelection = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else router.push("/login");
  };

  const getButtonClass = (key: string, value: string) => {
    const isSelected = selections[key] === value;
    return `w-full py-4 px-6 border rounded-xl text-left font-serif transition-colors text-lg ${
      isSelected 
        ? "border-[#0284c7] bg-blue-50 text-[#0284c7] shadow-sm font-semibold" 
        : "border-slate-300 text-slate-600 bg-white hover:border-slate-400 hover:bg-slate-50"
    }`;
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* LEFT CONTENT AREA */}
      <div className="w-full lg:w-[60%] flex flex-col relative h-full">
        <div className="flex-grow overflow-y-auto w-full max-w-2xl mx-auto px-8 py-16 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full">
                <div className="w-16 h-1 bg-[#0284c7] mb-8 rounded-full" />
                <h2 className="text-slate-500 font-bold tracking-widest uppercase mb-8 text-sm">Patient Context</h2>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-12">Referral Origin</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
                  <button onClick={() => handleSelection("source", "Employer")} className={getButtonClass("source", "Employer")}>Employer</button>
                  <button onClick={() => handleSelection("source", "Health plan")} className={getButtonClass("source", "Health plan")}>Health plan</button>
                  <button onClick={() => handleSelection("source", "My Doctor")} className={getButtonClass("source", "My Doctor")}>My Doctor</button>
                  <button onClick={() => handleSelection("source", "Word of Mouth")} className={getButtonClass("source", "Word of Mouth")}>Word of Mouth</button>
                  <button onClick={() => handleSelection("source", "Search Engine")} className={getButtonClass("source", "Search Engine")}>Search Engine</button>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full">
                <div className="w-16 h-1 bg-[#0284c7] mb-8 rounded-full" />
                <h2 className="text-slate-500 font-bold tracking-widest uppercase mb-8 text-sm">Insurance Provider</h2>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-12">Provider Routing Registry</h1>
                
                <div className="mb-20">
                  <select 
                    value={selections["referrer"] || ""}
                    onChange={(e) => handleSelection("referrer", e.target.value)}
                    className="w-full py-4 px-6 border border-slate-300 rounded-lg bg-white text-slate-800 text-lg focus:outline-none focus:border-[#0284c7] appearance-none shadow-sm font-medium"
                  >
                    <option value="" disabled>Select provider...</option>
                    <option value="blue_cross">Blue Cross Blue Shield</option>
                    <option value="kaiser">Kaiser Permanente</option>
                    <option value="cigna">Cigna Healthcare</option>
                    <option value="united">UnitedHealth Group</option>
                    <option value="other">Other / Not Listed</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full">
                <div className="w-32 h-[2px] bg-[#0284c7] mb-8" />
                <h2 className="text-[#0284c7] font-bold tracking-widest uppercase mb-8 text-xl">Welcome</h2>
                <p className="text-xl text-slate-600 font-serif mb-6">Answer just a few questions to find out how Prostate AI can help.</p>
                <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6">What brought you here today?</h1>
                <p className="text-sm text-slate-500 mb-8 uppercase tracking-widest font-bold">Select all that apply</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
                  <button onClick={() => handleSelection("reason", "Interest")} className={getButtonClass("reason", "Interest")}>Interest in prostate cancer risk</button>
                  <button onClick={() => handleSelection("reason", "Symptom")} className={getButtonClass("reason", "Symptom")}>Prostate related symptom</button>
                  <button onClick={() => handleSelection("reason", "Family")} className={getButtonClass("reason", "Family")}>Family history concerns</button>
                  <button onClick={() => handleSelection("reason", "Referral")} className={getButtonClass("reason", "Referral")}>Physician referral</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Bottom CTA Bar */}
        <div className="w-full bottom-0 sticky z-20 flex justify-end p-8 border-t border-slate-200 bg-white/90 backdrop-blur-sm">
           <button 
             onClick={nextStep}
             className="px-12 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase transition-colors rounded"
           >
             Continue
           </button>
        </div>
      </div>

      {/* RIGHT SPLIT (Solid background accent) */}
      <div className="hidden lg:block lg:w-[40%] bg-blue-50 border-l border-blue-100 relative">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'#0284c7\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

    </div>
  );
}
