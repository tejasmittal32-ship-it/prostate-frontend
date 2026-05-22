"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ArrowUpRight, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { patients, getRiskLabel, getRiskStyle } from "../../../lib/patientData";

const PAGE_SIZE = 12;

export default function PatientHistory() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.psa.toString().includes(searchTerm);
      
      const matchesRisk = riskFilter === null || p.risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [searchTerm, riskFilter]);

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE);
  const pagedPatients = filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative z-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">Patient Directory</h1>
          <p className="text-slate-500 font-medium tracking-wide">
            {patients.length} records from clinical dataset &bull; ML-classified risk assignments.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Patient ID, Name, or PSA level..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-white/50 border border-slate-200/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          {[null, 0, 1, 2, 3].map((risk) => {
            const isActive = riskFilter === risk;
            const label = risk === null ? "All" : getRiskLabel(risk);
            return (
              <motion.button
                key={String(risk)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setRiskFilter(risk); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                  isActive 
                    ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm' 
                    : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white'
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient ID</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Demographics</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">PSA (ng/mL)</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ML Risk</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 relative">
              {pagedPatients.length === 0 ? (
                <tr>
                   <td colSpan={7} className="py-12 text-center text-slate-500">
                     <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                     No patients found matching &ldquo;{searchTerm}&rdquo;
                   </td>
                </tr>
              ) : (
                pagedPatients.map((patient, i) => (
                  <motion.tr 
                    key={patient.id} 
                    onClick={() => router.push(`/patient/${patient.id}`)}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.9)", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="group cursor-pointer relative z-10"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-slate-600">{patient.id}</td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{patient.name}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-500">
                      Age {patient.age} &bull; BMI {patient.bmi}
                      {patient.familyHistory && <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">FH+</span>}
                      {patient.smoking && <span className="ml-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">SMK</span>}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-800">
                      {patient.psa}
                      {patient.psa > 4.0 && <span className="text-rose-500 ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-500">{patient.assessmentDate}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${getRiskStyle(patient.risk)}`}>
                        {getRiskLabel(patient.risk)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/patient/${patient.id}`); }}
                        className="p-2 text-slate-400 hover:text-[#0284c7] hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/50 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredPatients.length)} of {filteredPatients.length} records
          </span>
          <div className="flex gap-2 items-center">
            <button 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-white text-slate-700 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm font-bold text-slate-700 px-2">{page} / {totalPages}</span>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-white text-slate-700 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
