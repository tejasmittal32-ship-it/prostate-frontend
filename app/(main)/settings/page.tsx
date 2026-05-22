"use client";

import { useState } from "react";
import { UserCircle, Bell, Shield, Key, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Preferences");
  const [saved, setSaved] = useState(false);

  const tabs = [
    { name: "Preferences", icon: UserCircle },
    { name: "Notifications", icon: Bell },
    { name: "Security & API", icon: Key },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative z-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">Settings</h1>
        <p className="text-slate-500 font-medium tracking-wide">Manage clinical dashboard preferences and integration keys.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 space-y-2 relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative group"
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab"
                    className="absolute inset-0 bg-white border border-slate-200/60 rounded-xl shadow-sm z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 flex items-center gap-3 transition-colors ${
                  isActive ? "text-[#0284c7]" : "text-slate-500 group-hover:text-slate-800"
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#0284c7]" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {tab.name}
                </div>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <motion.div 
          layout
          className="flex-1 glass-panel p-8 min-h-[500px]"
        >
          
          {activeTab === "Preferences" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200/50 pb-2">AI Sensitivities</h3>
                
                <div className="space-y-4 mt-6">
                  <motion.div whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-4 bg-white/50 border border-slate-200/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="text-slate-800 font-bold">Flag PI-RADS 3 anomalies</h4>
                      <p className="text-slate-500 font-medium text-sm mt-1">Automatically categorize indeterminate scores as "Awaiting Review"</p>
                    </div>
                    {/* Toggle */}
                    <div className="w-12 h-6 bg-[#0284c7] rounded-full relative cursor-pointer shadow-inner">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-all" />
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-4 bg-white/50 border border-slate-200/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="text-slate-800 font-bold">Aggressive Volumetric Overlays</h4>
                      <p className="text-slate-500 font-medium text-sm mt-1">Render bounding boxes for micro-lesions {"<"}0.5cc</p>
                    </div>
                    {/* Toggle Disabled */}
                    <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-pointer border border-slate-400 shadow-inner">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-all" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="pt-6">
                 <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200/50 pb-2">Clinical Profile</h3>
                 <div className="grid grid-cols-2 gap-4 mt-6">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Display Name</label>
                     <input type="text" defaultValue="Dr. Mittal" className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition hover:bg-white shadow-sm" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                     <input type="text" defaultValue="Urologic Oncology" className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition hover:bg-white shadow-sm" />
                   </div>
                 </div>
              </div>

              <div className="pt-6 flex justify-end">
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-[#0284c7] rounded-xl text-white font-bold shadow-md hover:bg-[#0369a1] transition-colors">
                   {saved ? <Check className="w-4 h-4" /> : null}
                   {saved ? "Saved Configuration" : "Save Changes"}
                 </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "Notifications" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200/50 pb-2">Alert Preferences</h3>
              <p className="text-slate-500 font-medium">Manage how you receive diagnostic updates.</p>
            </motion.div>
          )}

          {activeTab === "Security & API" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200/50 pb-2">EHR Integration Keys</h3>
              <p className="text-slate-600 font-medium mb-6 text-sm">Use these keys to connect Prostate AI inference models to your existing Electronic Health Record infrastructure.</p>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Production Webhook Secret</label>
                <div className="flex gap-2">
                   <input type="password" value="sk_production_89fhu4ofnj1n2j3fn110" readOnly className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-mono shadow-inner outline-none" />
                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold transition-colors shadow-sm text-slate-700">Reveal</motion.button>
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
