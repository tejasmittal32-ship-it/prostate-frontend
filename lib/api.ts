/**
 * Prostate AI — API Service Layer v2
 * ====================================
 * With SHAP explainability and model metrics support.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PatientFeatures {
  age: number;
  family_history: number;
  smoking: number;
  activity_level: number;
  psa: number;
  region: number;
  diet: number;
  pollution: number;
  bmi: number;
  alcohol: number;
  sleep_hours: number;
}

export interface ShapFeature {
  feature: string;
  value: number;
  shap_value: number;
  direction: "risk_increasing" | "risk_decreasing";
}

export interface PredictionResult {
  risk_class: number;
  risk_label: string;
  risk_color: string;
  confidence: number;
  probabilities: Record<string, number>;
  feature_summary: Record<string, number>;
  model_used: string;
  shap_explanation: ShapFeature[] | null;
}

export interface ModelInfo {
  model_type: string;
  model_name: string;
  n_features: number;
  feature_names: string[];
  base_features: string[];
  engineered_features: string[];
  risk_labels: Record<string, string>;
  shap_available: boolean;
  n_estimators?: number;
  max_depth?: number;
  learning_rate?: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  shap_available: boolean;
  model_name: string;
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

export interface ModelMetricsData {
  accuracy: number;
  f1_macro: number;
  precision_macro: number;
  recall_macro: number;
  classification_report: Record<string, ClassMetrics | number>;
  confusion_matrix: number[][];
}

export interface AllMetrics {
  best_model: string;
  feature_names: string[];
  shap_feature_importance: Record<string, number>;
  RandomForest?: ModelMetricsData;
  XGBoost?: ModelMetricsData;
}

export interface FeatureImportance {
  importance: Record<string, number>;
  top_features: [string, number][];
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend unreachable");
  const data = await res.json();
  return {
    status: data.status,
    model_loaded: data.status === "ok",
    shap_available: true,
    model_name: "Random Forest"
  };
}

export async function getModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE_URL}/model/info`);
  if (!res.ok) throw new Error("Failed to fetch model info");
  return res.json();
}

export async function getModelMetrics(): Promise<AllMetrics> {
  const res = await fetch(`${API_BASE_URL}/model/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function getFeatureImportance(): Promise<FeatureImportance> {
  const res = await fetch(`${API_BASE_URL}/model/features`);
  if (!res.ok) throw new Error("Failed to fetch feature importance");
  return res.json();
}

export async function predictRisk(patient: PatientFeatures): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age: patient.age,
      family_history: patient.family_history,
      smoking: patient.smoking,
      activity_level: patient.activity_level,
      psa: patient.psa,
      region: patient.region,
      diet: patient.diet,
      pollution: patient.pollution,
      bmi: patient.bmi,
      alcohol: patient.alcohol,
      sleep_hours: patient.sleep_hours
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Prediction failed (${res.status})`);
  }

  const data = await res.json();
  
  // Transform new backend schema to expected frontend schema
  const labels = ["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"];
  const probabilitiesRecord: Record<string, number> = {};
  
  if (data.probabilities && Array.isArray(data.probabilities)) {
    data.probabilities.forEach((prob: number, index: number) => {
      const label = labels[index] || `Class ${index}`;
      probabilitiesRecord[label] = prob * 100;
    });
  }

  const confidence = data.probabilities ? Math.max(...(data.probabilities as number[])) * 100 : 0;
  
  const colors: Record<number, string> = { 0: "#10b981", 1: "#0284c7", 2: "#f59e0b", 3: "#ef4444" };

  const shap_explanation = data.feature_contributions ? 
    Object.entries(data.feature_contributions).map(([feature, shap_value]) => ({
      feature,
      value: (patient as any)[feature] ?? 0,
      shap_value: shap_value as number,
      direction: (shap_value as number) > 0 ? "risk_increasing" : "risk_decreasing"
    } as ShapFeature)) : null;

  return {
    risk_class: data.risk,
    risk_label: data.risk_label,
    risk_color: colors[data.risk] || "#94a3b8",
    confidence,
    probabilities: probabilitiesRecord,
    feature_summary: {
      age: patient.age,
      psa: patient.psa,
      bmi: patient.bmi,
      family_history: patient.family_history,
      smoking: patient.smoking,
      region: patient.region,
      diet: patient.diet,
      pollution: patient.pollution
    },
    model_used: "Random Forest", // Hardcoded based on MAIN implementation
    shap_explanation
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

export function riskClassToStatus(riskClass: number): string {
  const map: Record<number, string> = {
    0: "Routine Clearance",
    1: "Moderate Risk",
    2: "High Risk",
    3: "Critical Detection",
  };
  return map[riskClass] ?? "Unknown";
}

export function riskClassToStyle(riskClass: number): string {
  const map: Record<number, string> = {
    0: "bg-emerald-50 text-emerald-700",
    1: "bg-blue-50 text-blue-700",
    2: "bg-amber-50 text-amber-700",
    3: "bg-rose-50 text-rose-700",
  };
  return map[riskClass] ?? "bg-slate-50 text-slate-700";
}

/** Human-readable feature name */
export function humanizeFeature(feature: string): string {
  const map: Record<string, string> = {
    age: "Age",
    family_history: "Family History",
    smoking: "Smoking",
    activity_level: "Activity Level",
    psa: "PSA Level",
    region: "Region",
    diet: "Diet Quality",
    pollution: "Pollution",
    bmi: "BMI",
    alcohol: "Alcohol",
    sleep_hours: "Sleep Hours",
    age_psa: "Age × PSA",
    psa_elevated: "PSA Elevated",
    bmi_cat: "BMI Category",
    risk_factor_count: "Risk Factor Count",
    age_bracket: "Age Bracket",
    poor_sleep: "Poor Sleep",
  };
  return map[feature] ?? feature.replace(/_/g, " ");
}
