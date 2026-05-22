"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, ShieldCheck, Activity, Heart, Brain, User, Calendar, Dna, Cigarette, Wine, Moon, Footprints } from "lucide-react";
import { getPatientById, getRiskLabel, getRiskStyle } from "../../../../lib/patientData";
import { explainRisk } from "../../../../lib/riskExplainer";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const patient = getPatientById(patientId);

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Patient Not Found</h1>
        <p className="text-slate-500 mb-6">No record found for ID: {patientId}</p>
        <button onClick={() => router.push("/history")} className="px-6 py-2 bg-[#0284c7] text-white rounded-xl font-bold">
          Back to Directory
        </button>
      </div>
    );
  }

  const explanation = explainRisk(patient);

  const riskColors: Record<number, string> = {
    0: "#10b981", 1: "#0284c7", 2: "#f59e0b", 3: "#ef4444",
  };

  const priorityStyles: Record<string, string> = {
    urgent: "bg-rose-50 border-rose-200 text-rose-800",
    important: "bg-amber-50 border-amber-200 text-amber-800",
    suggested: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const priorityLabels: Record<string, string> = {
    urgent: "Urgent",
    important: "Important",
    suggested: "Suggested",
  };

  const impactStyles: Record<string, string> = {
    high: "bg-rose-100 text-rose-700",
    moderate: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  const activityLabels: Record<number, string> = { 0: "Sedentary", 1: "Moderate", 2: "Active" };
  const regionLabels: Record<number, string> = { 0: "Region A", 1: "Region B", 2: "Region C" };
  const dietLabels: Record<number, string> = { 0: "Poor", 1: "Average", 2: "Healthy" };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative z-10">
      
      {/* Back Button */}
      <motion.button 
        whileHover={{ x: -3 }} 
        onClick={() => router.push("/history")} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Patient Directory
      </motion.button>

      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center">
            <User className="w-7 h-7 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
            <p className="text-sm text-slate-500 font-medium">{patient.id} &bull; Assessment: {patient.assessmentDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-xl text-sm font-black ${getRiskStyle(patient.risk)}`}>
            {getRiskLabel(patient.risk)}
          </span>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Risk Score</p>
            <p className="text-2xl font-black" style={{ color: riskColors[patient.risk] }}>{explanation.riskScore}</p>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border ${
          patient.risk >= 3 ? 'bg-rose-50 border-rose-200' : 
          patient.risk >= 2 ? 'bg-amber-50 border-amber-200' : 
          'bg-blue-50 border-blue-200'
        }`}
      >
        <p className="text-sm font-medium text-slate-700 leading-relaxed">{explanation.summary}</p>
      </motion.div>

      {/* Patient Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Age", value: patient.age, icon: Calendar, unit: "yrs" },
          { label: "PSA", value: patient.psa, icon: Activity, unit: "ng/mL" },
          { label: "BMI", value: patient.bmi, icon: Heart, unit: "" },
          { label: "Sleep", value: patient.sleepHours, icon: Moon, unit: "hrs" },
          { label: "Activity", value: activityLabels[patient.activityLevel], icon: Footprints, unit: "" },
          { label: "Diet", value: dietLabels[patient.diet], icon: Heart, unit: "" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 text-center">
              <Icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="text-lg font-black text-slate-800">{item.value}{item.unit && <span className="text-xs text-slate-400 ml-0.5 font-medium">{item.unit}</span>}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{item.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Clinical Flags */}
      <div className="flex gap-3 flex-wrap">
        {patient.familyHistory && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
            <Dna className="w-3.5 h-3.5" /> Family History Positive
          </span>
        )}
        {patient.smoking && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
            <Cigarette className="w-3.5 h-3.5" /> Active Smoker
          </span>
        )}
        {patient.alcohol && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-bold text-purple-700">
            <Wine className="w-3.5 h-3.5" /> Alcohol Consumer
          </span>
        )}
        {patient.psa >= 4.0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Elevated PSA
          </span>
        )}
        {patient.bmi >= 30 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-700">
            <Heart className="w-3.5 h-3.5" /> BMI ≥ 30 (Obese)
          </span>
        )}
      </div>

      {/* Two-column layout: Risk Factors + Protective Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Factors */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Risk Factors ({explanation.riskFactors.length})
          </h3>
          {explanation.riskFactors.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium">No significant risk factors identified.</p>
          ) : (
            <div className="space-y-4">
              {explanation.riskFactors.map((rf, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="p-4 bg-white/50 border border-slate-200/60 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-800">{rf.factor}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${impactStyles[rf.impact]}`}>{rf.impact}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-2">Value: {rf.value}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{rf.explanation}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Protective Factors */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Protective Factors ({explanation.protectiveFactors.length})
          </h3>
          {explanation.protectiveFactors.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium">No significant protective factors identified.</p>
          ) : (
            <div className="space-y-4">
              {explanation.protectiveFactors.map((pf, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="p-4 bg-white/50 border border-slate-200/60 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-800">{pf.factor}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-700">Protective</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-2">Value: {pf.value}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{pf.explanation}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Health Recommendations */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#0284c7]" /> Personalized Health Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {explanation.recommendations.map((rec, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 + i * 0.06 }}
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-xl border ${priorityStyles[rec.priority]} transition-shadow hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-black">{rec.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider opacity-70">
                      {priorityLabels[rec.priority]}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">{rec.category}</p>
                  <p className="text-xs leading-relaxed opacity-90">{rec.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
