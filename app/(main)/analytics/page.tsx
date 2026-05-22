"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, BarChart3, Target, Loader2, AlertCircle, Trophy, Layers, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getModelMetrics, getFeatureImportance, getModelInfo, humanizeFeature, type AllMetrics, type FeatureImportance, type ModelInfo } from "../../../lib/api";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [features, setFeatures] = useState<FeatureImportance | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, f, i] = await Promise.all([
          getModelMetrics(),
          getFeatureImportance(),
          getModelInfo(),
        ]);
        setMetrics(m);
        setFeatures(f);
        setModelInfo(i);
      } catch (e: any) {
        setError(e.message || "Failed to load analytics. Is the ML backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-[#0284c7] animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Loading model analytics from backend...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-32">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
        <p className="text-slate-700 font-bold text-lg mb-2">Analytics Unavailable</p>
        <p className="text-slate-500 text-sm">{error || "Could not load metrics."}</p>
        <p className="text-slate-400 text-xs mt-4">Make sure the ML backend is running: <code className="bg-slate-100 px-2 py-1 rounded font-mono">uvicorn api.main:app --port 8000</code></p>
      </div>
    );
  }

  // Prepare data
  const bestName = metrics.best_model || "Unknown";
  const bestMetrics = (metrics as any)[bestName] as any;
  const rfMetrics = metrics.RandomForest;
  const xgbMetrics = metrics.XGBoost;

  // Feature importance chart data
  const featureChartData = features?.top_features?.map(([name, value]) => ({
    name: humanizeFeature(name),
    importance: value,
  })) ?? [];

  // Model comparison data
  const comparisonData = [];
  if (rfMetrics) comparisonData.push({ name: "RandomForest", accuracy: rfMetrics.accuracy * 100, f1: rfMetrics.f1_macro * 100 });
  if (xgbMetrics) comparisonData.push({ name: "XGBoost", accuracy: xgbMetrics.accuracy * 100, f1: xgbMetrics.f1_macro * 100 });

  // Confusion matrix data
  const confMatrix = bestMetrics?.confusion_matrix ?? [];
  const riskLabels = ["Low", "Moderate", "High", "Critical"];

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative z-10">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">Model Analytics</h1>
          <p className="text-slate-500 font-medium">
            Performance metrics, SHAP feature importance, and model comparison.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-black text-emerald-700">Winner: {bestName}</span>
        </div>
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Model Type", value: modelInfo?.model_type ?? bestName, icon: Brain, theme: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "Accuracy", value: `${((bestMetrics?.accuracy ?? 0) * 100).toFixed(1)}%`, icon: Target, theme: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "F1 Score (Macro)", value: `${((bestMetrics?.f1_macro ?? 0) * 100).toFixed(1)}%`, icon: Zap, theme: "bg-amber-50 text-amber-600 border-amber-100" },
          { label: "Features Used", value: `${modelInfo?.n_features ?? 17}`, icon: Layers, theme: "bg-purple-50 text-purple-600 border-purple-100" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
              className="glass-panel p-5 flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl border ${stat.theme}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two-column: Feature Importance + Model Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SHAP Feature Importance */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-panel p-6 lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">SHAP Feature Importance</h3>
              <p className="text-xs text-slate-500 mt-1">Mean |SHAP value| — global impact on predictions</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">EXPLAINABLE AI</span>
          </div>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '12px' }}
                  formatter={(val: number) => [val.toFixed(4), "SHAP Importance"]}
                />
                <Bar dataKey="importance" barSize={16} radius={[0, 6, 6, 0]}>
                  {featureChartData.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#0284c7' : i < 6 ? '#38bdf8' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Model Comparison */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="glass-panel p-6"
        >
          <h3 className="text-base font-bold text-slate-800 mb-4">Model Comparison</h3>
          <div className="space-y-4">
            {comparisonData.map((model, i) => {
              const isWinner = model.name === bestName;
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isWinner 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-white/50 border-slate-200/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                      {isWinner && <Trophy className="w-4 h-4 text-emerald-500" />}
                      {model.name}
                    </span>
                    {isWinner && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">BEST</span>}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Accuracy</span>
                        <span className="font-bold text-slate-700">{model.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${model.accuracy}%` }} transition={{ duration: 1 }} className="h-full bg-[#0284c7] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">F1 Score</span>
                        <span className="font-bold text-slate-700">{model.f1.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${model.f1}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Engineered Features List */}
          {modelInfo?.engineered_features && (
            <div className="mt-6 pt-4 border-t border-slate-200/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Engineered Features</p>
              <div className="flex flex-wrap gap-1.5">
                {modelInfo.engineered_features.map((f, i) => (
                  <span key={i} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {humanizeFeature(f)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Confusion Matrix Heatmap */}
      {confMatrix.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-800 mb-2">Confusion Matrix</h3>
          <p className="text-xs text-slate-500 mb-6">True vs. Predicted labels for the best model ({bestName})</p>
          <div className="flex justify-center">
            <div>
              <div className="flex mb-1 ml-20">
                {riskLabels.map((l, i) => (
                  <div key={i} className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l}</div>
                ))}
              </div>
              {confMatrix.map((row: number[], ri: number) => (
                <div key={ri} className="flex items-center">
                  <span className="w-20 text-right pr-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{riskLabels[ri]}</span>
                  {row.map((val: number, ci: number) => {
                    const maxVal = Math.max(...confMatrix.flat());
                    const intensity = val / maxVal;
                    const isDiag = ri === ci;
                    return (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (ri * 4 + ci) * 0.03 }}
                        className={`w-20 h-14 flex items-center justify-center border border-white/50 rounded-md m-0.5 ${
                          isDiag ? 'font-black text-white' : 'font-bold text-slate-700'
                        }`}
                        style={{
                          backgroundColor: isDiag 
                            ? `rgba(2, 132, 199, ${0.3 + intensity * 0.7})`
                            : `rgba(239, 68, 68, ${intensity * 0.3})`,
                        }}
                      >
                        {val}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              <div className="flex mt-2 ml-20">
                <div className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">← Predicted →</div>
              </div>
            </div>
          </div>
          <div className="text-center mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">↑ Actual ↓</span>
          </div>
        </motion.div>
      )}

      {/* Per-Class Metrics */}
      {bestMetrics?.classification_report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Per-Class Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {riskLabels.map((label, i) => {
              const fullLabel = ["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"][i];
              const classData = bestMetrics.classification_report[fullLabel];
              if (!classData) return null;
              const riskColors = ["#10b981", "#0284c7", "#f59e0b", "#ef4444"];
              return (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="p-4 bg-white/50 border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColors[i] }} />
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: "precision", label: "Precision" },
                      { key: "recall", label: "Recall" },
                      { key: "f1-score", label: "F1 Score" },
                    ].map((m) => (
                      <div key={m.key}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-500">{m.label}</span>
                          <span className="font-bold text-slate-700">{((classData as any)[m.key] * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(classData as any)[m.key] * 100}%`, backgroundColor: riskColors[i] }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Support: {(classData as any).support} samples</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

    </div>
  );
}
