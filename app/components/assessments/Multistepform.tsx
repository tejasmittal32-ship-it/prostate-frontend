"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle, ChevronRight, ChevronLeft, ActivitySquare, ShieldAlert, Calendar, Loader2, Maximize, Search, Scan, Wifi, WifiOff, Brain } from "lucide-react";
import { predictRisk, checkHealth, humanizeFeature, type PredictionResult } from "../../../lib/api";

type FormData = {
  age: number;
  psa: number;
  bmi: number;
  family_history: string;
  smoking: string;
  activity_level: string;
  alcohol: string;
  sleep_hours: number;
  region: string;
  diet: string;
  pollution: string;
};

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  


  useEffect(() => {
    setIsMounted(true);
    // Check backend health on mount
    checkHealth()
      .then((h) => setBackendOnline(h.model_loaded))
      .catch(() => setBackendOnline(false));
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ mode: "onChange" });

  const processAI = async (data: FormData) => {
    setIsSimulating(true);
    setApiError(null);

    try {
      const result = await predictRisk({
        age: Number(data.age),
        family_history: data.family_history === "first_degree" ? 1 : data.family_history === "second_degree" ? 2 : 0,
        smoking: data.smoking === "yes" ? 1 : 0,
        activity_level: Number(data.activity_level) || 1,
        psa: Number(data.psa),
        region: Number(data.region) || 0,
        diet: Number(data.diet) || 0,
        pollution: Number(data.pollution) || 0,
        bmi: Number(data.bmi) || 25.0,
        alcohol: data.alcohol === "yes" ? 1 : 0,
        sleep_hours: Number(data.sleep_hours) || 7.0,
      });

      setPrediction(result);
      setIsSimulating(false);
      setResultReady(true);
      setStep(4);
    } catch (err: any) {
      // If backend is down, use a simulated fallback
      console.warn("ML backend unreachable, using simulated result:", err.message);
      setApiError("Backend offline — showing simulated result");
      
      // Simulate a brief delay
      await new Promise(r => setTimeout(r, 2000));
      
      const psa = Number(data.psa);
      const age = Number(data.age);
      const fh = data.family_history === "first_degree" ? 1 : data.family_history === "second_degree" ? 2 : 0;
      let simRisk = 0;
      if (psa > 6 || (age > 75 && psa > 3)) simRisk = 3;
      else if (psa > 4 || (fh && psa > 2)) simRisk = 2;
      else if (psa > 2 || age > 65) simRisk = 1;
      
      const labels: Record<number, string> = { 0: "Low Risk", 1: "Moderate Risk", 2: "High Risk", 3: "Critical Risk" };
      const colors: Record<number, string> = { 0: "#10b981", 1: "#0284c7", 2: "#f59e0b", 3: "#ef4444" };

      setPrediction({
        risk_class: simRisk,
        risk_label: labels[simRisk],
        risk_color: colors[simRisk],
        confidence: 72 + Math.random() * 20,
        probabilities: {
          "Low Risk": simRisk === 0 ? 65 : 10,
          "Moderate Risk": simRisk === 1 ? 55 : 15,
          "High Risk": simRisk === 2 ? 60 : 10,
          "Critical Risk": simRisk === 3 ? 70 : 5,
        },
        feature_summary: { age, psa, bmi: Number(data.bmi), family_history: fh, smoking: data.smoking === "yes" ? 1 : 0, region: Number(data.region) || 0, diet: Number(data.diet) || 0, pollution: Number(data.pollution) || 0 },
      });
      setIsSimulating(false);
      setResultReady(true);
      setStep(4);
    }
  };

  const onSubmit = (data: FormData) => {
    processAI(data);
  };

  const nextStep = async () => {
    const isStepValid = await trigger();
    if (isStepValid) setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));



  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!isMounted) return null;

  // Determine result display style based on risk class
  const riskStyles: Record<number, { bg: string; border: string; text: string; icon: string }> = {
    0: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-600" },
    1: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600" },
    2: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600" },
    3: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" },
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-8 relative">

      {/* Backend Status Indicator */}
      <div className="absolute top-4 right-4 z-20">
        {backendOnline === null ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
          </div>
        ) : backendOnline ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <Wifi className="w-3 h-3" /> ML Model Online
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            <WifiOff className="w-3 h-3" /> Offline Mode
          </div>
        )}
      </div>

      {step < 4 && (
        <div className="mb-8 relative z-10">
          <div className="flex justify-between mb-2">
            {["Patient Info", "Biomarkers", "Confirm"].map((label, i) => (
              <span key={i} className={`text-xs font-bold uppercase tracking-widest ${step >= i + 1 ? 'text-[#0284c7]' : 'text-slate-400'}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="bg-gradient-to-r from-[#38bdf8] to-[#0284c7] h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="relative z-10">
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-5">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <ActivitySquare className="w-5 h-5 text-[#0284c7]" />
                  Primary Patient Data
                </h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">Provide essential demographics. These features feed directly into the ML model.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Age *</label>
                    <input
                      type="number"
                      {...register("age", { required: "Age is required", min: { value: 18, message: "Min 18" }, max: { value: 100, message: "Max 100" }})}
                      className={`w-full input-light ${errors.age ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="e.g. 65"
                    />
                    {errors.age && <p className="text-red-500 text-[12px] mt-1 ml-1 font-bold">{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">BMI *</label>
                    <input
                      type="number" step="0.1"
                      {...register("bmi", { required: "BMI is required", min: { value: 10, message: "Min 10" }, max: { value: 60, message: "Max 60" }})}
                      className={`w-full input-light ${errors.bmi ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="e.g. 27.5"
                    />
                    {errors.bmi && <p className="text-red-500 text-[12px] mt-1 ml-1 font-bold">{errors.bmi.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Smoking</label>
                    <select {...register("smoking")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Alcohol</label>
                    <select {...register("alcohol")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Activity Level</label>
                    <select {...register("activity_level")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="0">Low</option>
                      <option value="1">Moderate</option>
                      <option value="2">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Sleep (hrs)</label>
                    <input type="number" step="0.5" {...register("sleep_hours")} className="w-full input-light" placeholder="e.g. 7" defaultValue={7} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Diet Quality</label>
                    <select {...register("diet")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="0">Poor</option>
                      <option value="1">Average</option>
                      <option value="2">Healthy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Region</label>
                    <select {...register("region")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="0">Urban</option>
                      <option value="1">Suburban</option>
                      <option value="2">Rural</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Pollution Exposure</label>
                    <select {...register("pollution")} className="w-full input-light appearance-none cursor-pointer">
                      <option value="0">Low</option>
                      <option value="1">Moderate</option>
                      <option value="2">High</option>
                    </select>
                  </div>
                </div>
              </motion.div>
             )}

            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-5">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <ActivitySquare className="w-5 h-5 text-[#0284c7]" /> Clinical Biomarkers
                </h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">PSA level is the primary biomarker used by the ML model for risk stratification.</p>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">PSA Level (ng/mL) *</label>
                  <input
                    type="number" step="0.1"
                    {...register("psa", { required: "PSA is required", min: { value: 0, message: "Cannot be negative" }, max: { value: 100, message: "Max 100" }})}
                    className={`w-full input-light ${errors.psa ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="e.g. 4.5"
                  />
                  {errors.psa && <p className="text-red-500 text-[12px] mt-1 ml-1 font-bold">{errors.psa.message}</p>}
                  <p className="text-xs text-slate-400 mt-2 ml-1">Normal range: &lt;4.0 ng/mL. Elevated PSA significantly impacts model output.</p>
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Family History</label>
                  <select {...register("family_history")} className="w-full input-light appearance-none cursor-pointer">
                    <option value="none">No known history</option>
                    <option value="first_degree">First-degree relative with prostate cancer</option>
                    <option value="second_degree">Second-degree relative with prostate cancer</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-6 flex flex-col items-center justify-center text-center py-10">
                {!isSimulating ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}>
                      <Brain className="w-16 h-16 text-[#0284c7] mb-4" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Ready for ML Inference</h2>
                    <p className="text-slate-500 font-medium max-w-sm">
                      Patient features will be sent to the <span className="font-bold text-[#0284c7]">RandomForest classifier</span> trained on 10,001 clinical records.
                    </p>
                    {backendOnline === false && (
                      <p className="text-amber-600 text-xs font-bold mt-2 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                        ⚠ Backend offline — will use simulated fallback
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <motion.div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                       <div className="absolute inset-0 border-4 border-slate-100 border-t-[#0284c7] rounded-full animate-spin shadow-sm" />
                       <Scan className="w-8 h-8 text-[#0284c7] animate-pulse" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Running ML Inference...</h2>
                    <p className="text-slate-500 font-medium max-w-sm">Classifying risk across 4 categories using trained model weights.</p>
                  </>
                )}
              </motion.div>
            )}

            {step === 4 && resultReady && prediction && (
              <motion.div key="step4_result" variants={variants} initial="initial" animate="animate" className="space-y-6 py-2">
                
                {apiError && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    ⚠ {apiError}
                  </div>
                )}

                {/* ML Result Card */}
                <div className={`p-6 bg-white border ${riskStyles[prediction.risk_class]?.border || 'border-slate-200'} rounded-2xl shadow-lg mb-6`}>
                  <div className="flex items-center gap-4 w-full mb-4">
                     <div className={`p-3 ${riskStyles[prediction.risk_class]?.bg} rounded-full`}>
                       <ShieldAlert className={`w-8 h-8 ${riskStyles[prediction.risk_class]?.icon}`} />
                     </div>
                     <div className="text-left flex-1">
                       <h2 className="text-xl font-black text-slate-900">{prediction.risk_label}</h2>
                       <p className="text-slate-600 font-medium text-sm mt-0.5">
                         Model Confidence: <span className="font-black">{prediction.confidence.toFixed(1)}%</span>
                       </p>
                     </div>
                     {prediction.risk_class >= 2 && (
                       <button type="button" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
                         <Calendar className="w-4 h-4" /> Schedule Biopsy
                       </button>
                     )}
                  </div>

                  {/* Probability Breakdown */}
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Class Probabilities</p>
                    {Object.entries(prediction.probabilities).map(([label, prob]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 w-28 truncate">{label}</span>
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${prob}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: prediction.risk_color }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-12 text-right">{prob.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHAP Waterfall — Feature Impact Chart */}
                {prediction.shap_explanation && prediction.shap_explanation.length > 0 && (
                  <div className="glass-panel p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SHAP Feature Impact</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Which features drove this prediction — powered by {prediction.model_used || 'ML'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">EXPLAINABLE AI</span>
                    </div>
                    <div className="space-y-2">
                      {prediction.shap_explanation.slice(0, 8).map((feat, i) => {
                        const isPositive = feat.direction === "risk_increasing";
                        const barWidth = Math.min(Math.abs(feat.shap_value) * 300, 100);
                        const featureLabel = humanizeFeature(feat.feature);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-600 w-32 truncate text-right">
                              {featureLabel}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 w-12 text-right">{feat.value}</span>
                            <div className="flex-1 flex items-center">
                              <div className="w-full flex items-center" style={{ direction: isPositive ? 'ltr' : 'rtl' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                                  className={`h-4 rounded ${isPositive ? 'bg-rose-400/80' : 'bg-emerald-400/80'}`}
                                />
                              </div>
                            </div>
                            <span className={`text-[10px] font-black w-16 ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isPositive ? '+' : ''}{feat.shap_value.toFixed(3)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600">
                        <span className="w-3 h-3 rounded bg-rose-400/80" /> Risk Increasing
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <span className="w-3 h-3 rounded bg-emerald-400/80" /> Risk Decreasing
                      </span>
                    </div>
                  </div>
                )}

                {/* Feature Summary */}
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Input Features Used</p>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(prediction.feature_summary).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <p className="text-lg font-black text-slate-800">{typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={isSimulating}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'} ${isSimulating ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={nextStep}
                className="px-8 py-2.5 rounded-lg flex items-center gap-2 btn-3d-primary font-bold tracking-wide z-20 shadow-md transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={!isSimulating ? { scale: 1.02 } : {}}
                whileTap={!isSimulating ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isSimulating}
                className={`px-8 py-2.5 rounded-lg flex items-center gap-2 btn-3d-primary font-bold tracking-wide z-20 shadow-md relative ${isSimulating ? 'opacity-70 cursor-wait' : ''}`}
              >
                <Brain className="w-4 h-4" />
                {isSimulating ? 'Running Model...' : 'Run ML Inference'}
              </motion.button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
