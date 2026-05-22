"use client";

import { motion } from "framer-motion";
import { Users, FileText, AlertTriangle, Activity, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { patients, getStats, getPsaDistribution, getRiskDistribution, getRiskLabel, getRiskStyle } from "../../../lib/patientData";

export default function Dashboard() {
  const stats = getStats();
  const psaData = getPsaDistribution();
  const riskData = getRiskDistribution();

  const statCards = [
    { title: "Total Assessments", value: stats.total.toLocaleString(), icon: Users, theme: "bg-blue-50 text-blue-600 border-blue-100" },
    { title: "Routine Clearance", value: stats.routine.toLocaleString(), icon: CheckCircle, theme: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { title: "Awaiting / High", value: (stats.moderate + stats.high).toLocaleString(), icon: Clock, theme: "bg-amber-50 text-amber-600 border-amber-100" },
    { title: "Critical Detection", value: stats.critical.toLocaleString(), icon: AlertTriangle, theme: "bg-rose-50 text-rose-600 border-rose-100" },
  ];

  // Get latest 5 patients for recent feed
  const recentPatients = patients.slice(0, 5);

  const RISK_COLORS = ["#10b981", "#0284c7", "#f59e0b", "#ef4444"];

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative z-10">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Clinical Overview</h1>
          <p className="text-slate-500 font-medium text-sm">
            Powered by <span className="text-[#0284c7] font-bold">ML inference</span> on {stats.total} patient records.
          </p>
        </div>
        
        <div className="flex gap-3">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 glass-panel hover:bg-white text-slate-700 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm">
            <FileText className="w-4 h-4" /> Export CSV
          </motion.button>
          <motion.button whileHover={{ y: -2, boxShadow: "0px 8px 20px rgba(2,132,199,0.2)" }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-[#0284c7] text-white rounded-xl flex items-center gap-2 font-medium shadow-sm text-sm">
            <Activity className="w-4 h-4" /> Run Batch Inference
          </motion.button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
              className="glass-panel p-5 flex items-center gap-4 cursor-pointer"
            >
              <div className={`p-3 rounded-xl border ${stat.theme}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        {/* PSA Distribution Chart */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="glass-panel p-6 lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">PSA Distribution</h3>
              <p className="text-xs text-slate-500 mt-1">Serum PSA levels across patient cohort (ng/mL)</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-md border border-slate-200">Real Data</span>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={psaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.5)'}}
                  contentStyle={{backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderColor: '#e2e8f0', color: '#334155', fontSize: '13px', borderRadius: '12px'}}
                />
                <Bar dataKey="count" barSize={40} radius={[6, 6, 0, 0]}>
                  {psaData.map((_, index) => (
                    <Cell key={index} fill={index < 3 ? '#38bdf8' : index < 5 ? '#f59e0b' : '#ef4444'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Breakdown Pie */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.15 }}
           className="glass-panel p-6"
        >
          <h3 className="text-base font-bold text-slate-800 mb-2">Risk Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">ML classification output distribution</p>
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {riskData.map((_, index) => (
                    <Cell key={index} fill={RISK_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {riskData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[i] }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Assessments */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800">Recent Assessments</h3>
          <a href="/history" className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1">
            View all <TrendingUp className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {recentPatients.map((p, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }} className="p-4 bg-white/50 hover:bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 text-sm">{p.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskStyle(p.risk)}`}>
                  {getRiskLabel(p.risk)}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mb-1">{p.name}</p>
              <p className="text-xs text-slate-500">Age {p.age} &bull; PSA {p.psa}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}