/**
 * Risk Explainer Module
 * ======================
 * Analyzes a patient's features and explains WHY they are at their risk level.
 * Generates personalized health improvement recommendations.
 */

import type { PatientRecord } from "./patientData";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RiskFactor {
  factor: string;
  value: string;
  impact: "high" | "moderate" | "low";
  explanation: string;
}

export interface HealthRecommendation {
  category: string;
  icon: string; // emoji
  title: string;
  description: string;
  priority: "urgent" | "important" | "suggested";
}

export interface RiskExplanation {
  summary: string;
  riskFactors: RiskFactor[];
  protectiveFactors: RiskFactor[];
  recommendations: HealthRecommendation[];
  riskScore: number; // 0-100 composite score
}

// ── Population Norms (derived from CSV dataset averages) ──────────────────────

const NORMS = {
  age: { mean: 61.5, high: 70 },
  psa: { mean: 2.0, elevated: 4.0, high: 6.0 },
  bmi: { mean: 27.5, overweight: 25, obese: 30, morbid: 35 },
  sleepHours: { mean: 6.5, low: 5.0, ideal: 7.0 },
};

// ── Core Analysis ─────────────────────────────────────────────────────────────

export function explainRisk(patient: PatientRecord): RiskExplanation {
  const riskFactors: RiskFactor[] = [];
  const protectiveFactors: RiskFactor[] = [];

  // ── Age Analysis ────────────────────────────────────────────────────────
  if (patient.age >= 75) {
    riskFactors.push({
      factor: "Advanced Age",
      value: `${patient.age} years`,
      impact: "high",
      explanation: `At ${patient.age} years old, the patient is in the highest age bracket for prostate cancer risk. Incidence rates increase dramatically after age 65, with the majority of cases diagnosed between ages 65-80.`,
    });
  } else if (patient.age >= 65) {
    riskFactors.push({
      factor: "Elevated Age",
      value: `${patient.age} years`,
      impact: "moderate",
      explanation: `Age ${patient.age} places the patient in the elevated-risk demographic. Prostate cancer screening is strongly recommended for men over 50, with increased vigilance beyond 65.`,
    });
  } else if (patient.age < 55) {
    protectiveFactors.push({
      factor: "Younger Age",
      value: `${patient.age} years`,
      impact: "low",
      explanation: `At ${patient.age}, the patient is below the median age for prostate cancer diagnosis. While not immune, younger age is generally associated with lower incidence.`,
    });
  }

  // ── PSA Analysis ────────────────────────────────────────────────────────
  if (patient.psa >= 6.0) {
    riskFactors.push({
      factor: "Significantly Elevated PSA",
      value: `${patient.psa} ng/mL`,
      impact: "high",
      explanation: `A PSA level of ${patient.psa} ng/mL is well above the 4.0 ng/mL threshold. Levels above 6.0 strongly correlate with increased cancer probability and may warrant immediate biopsy consideration.`,
    });
  } else if (patient.psa >= 4.0) {
    riskFactors.push({
      factor: "Elevated PSA",
      value: `${patient.psa} ng/mL`,
      impact: "moderate",
      explanation: `PSA of ${patient.psa} ng/mL exceeds the standard 4.0 ng/mL cutoff. While PSA can be elevated due to benign conditions (BPH, prostatitis), this level warrants further investigation.`,
    });
  } else if (patient.psa < 1.5) {
    protectiveFactors.push({
      factor: "Low PSA",
      value: `${patient.psa} ng/mL`,
      impact: "low",
      explanation: `A PSA of ${patient.psa} ng/mL is well within normal range. Low PSA levels are associated with significantly reduced prostate cancer risk.`,
    });
  }

  // ── Family History ──────────────────────────────────────────────────────
  if (patient.familyHistory) {
    riskFactors.push({
      factor: "Positive Family History",
      value: "First-degree relative",
      impact: "high",
      explanation: `Having a first-degree relative (father or brother) with prostate cancer approximately doubles the patient's risk. Genetic predisposition accounts for 5-10% of all prostate cancers and tends to present at younger ages.`,
    });
  } else {
    protectiveFactors.push({
      factor: "No Family History",
      value: "None reported",
      impact: "low",
      explanation: `No family history of prostate cancer reduces the overall genetic risk component. Screening can follow standard age-based guidelines.`,
    });
  }

  // ── Smoking ─────────────────────────────────────────────────────────────
  if (patient.smoking) {
    riskFactors.push({
      factor: "Active Smoker",
      value: "Current smoker",
      impact: "moderate",
      explanation: `Smoking is associated with a 24-30% increased risk of fatal prostate cancer. Smokers are also more likely to be diagnosed with aggressive, advanced-stage disease. Tobacco compounds may promote tumor angiogenesis.`,
    });
  }

  // ── BMI Analysis ────────────────────────────────────────────────────────
  if (patient.bmi >= 35) {
    riskFactors.push({
      factor: "Morbid Obesity",
      value: `BMI ${patient.bmi}`,
      impact: "high",
      explanation: `A BMI of ${patient.bmi} indicates morbid obesity, which is strongly associated with aggressive prostate cancer. Excess adipose tissue increases circulating estrogen, insulin, and inflammatory markers that promote tumor growth.`,
    });
  } else if (patient.bmi >= 30) {
    riskFactors.push({
      factor: "Obesity",
      value: `BMI ${patient.bmi}`,
      impact: "moderate",
      explanation: `BMI ${patient.bmi} falls in the obese category. Obesity is linked to higher-grade prostate tumors and poorer treatment outcomes. Weight management is a modifiable risk factor.`,
    });
  } else if (patient.bmi >= 18.5 && patient.bmi < 25) {
    protectiveFactors.push({
      factor: "Healthy Weight",
      value: `BMI ${patient.bmi}`,
      impact: "low",
      explanation: `A BMI of ${patient.bmi} is within the healthy range, which is associated with better overall cancer outcomes and lower risk of aggressive disease.`,
    });
  }

  // ── Alcohol ─────────────────────────────────────────────────────────────
  if (patient.alcohol) {
    riskFactors.push({
      factor: "Alcohol Consumption",
      value: "Regular consumer",
      impact: "low",
      explanation: `Regular alcohol consumption may modestly increase prostate cancer risk through hormonal disturbances and oxidative stress. Heavy drinking is particularly associated with advanced-stage diagnosis.`,
    });
  }

  // ── Sleep ───────────────────────────────────────────────────────────────
  if (patient.sleepHours < 5.0) {
    riskFactors.push({
      factor: "Severe Sleep Deprivation",
      value: `${patient.sleepHours} hrs/night`,
      impact: "moderate",
      explanation: `Only ${patient.sleepHours} hours of sleep per night is significantly below the recommended 7-9 hours. Chronic sleep deprivation disrupts melatonin production and immune function, both critical for cancer defense.`,
    });
  } else if (patient.sleepHours >= 7 && patient.sleepHours <= 8.5) {
    protectiveFactors.push({
      factor: "Adequate Sleep",
      value: `${patient.sleepHours} hrs/night`,
      impact: "low",
      explanation: `${patient.sleepHours} hours of nightly sleep falls within the optimal range for immune function and hormonal regulation.`,
    });
  }

  // ── Activity Level ──────────────────────────────────────────────────────
  if (patient.activityLevel === 0) {
    riskFactors.push({
      factor: "Low Physical Activity",
      value: "Sedentary",
      impact: "moderate",
      explanation: `A sedentary lifestyle is associated with increased prostate cancer risk. Regular physical activity reduces circulating androgens, insulin, and inflammatory markers that promote tumor development.`,
    });
  } else if (patient.activityLevel === 2) {
    protectiveFactors.push({
      factor: "High Physical Activity",
      value: "Active lifestyle",
      impact: "low",
      explanation: `High physical activity is protective against aggressive prostate cancer. Exercise improves immune surveillance, reduces inflammation, and maintains healthy testosterone metabolism.`,
    });
  }

  // ── Generate Recommendations ────────────────────────────────────────────
  const recommendations: HealthRecommendation[] = [];

  // Always recommend based on risk level
  const riskLabels: Record<number, string> = { 0: "Low", 1: "Moderate", 2: "High", 3: "Critical" };

  if (patient.risk >= 3) {
    recommendations.push({
      category: "Clinical Action",
      icon: "🏥",
      title: "Immediate Urology Consultation",
      description: "Schedule an urgent appointment with a urologic oncologist. Based on the ML risk assessment, a targeted MRI-guided biopsy is strongly recommended within 2 weeks.",
      priority: "urgent",
    });
  }

  if (patient.risk >= 2) {
    recommendations.push({
      category: "Diagnostic",
      icon: "🔬",
      title: "Multi-parametric MRI",
      description: "A mpMRI scan should be performed to localize suspected lesions before any biopsy procedure. This improves diagnostic accuracy and reduces unnecessary biopsies.",
      priority: "urgent",
    });
  }

  if (patient.psa >= 4.0) {
    recommendations.push({
      category: "Monitoring",
      icon: "📊",
      title: "PSA Velocity Tracking",
      description: `Current PSA is ${patient.psa} ng/mL. Repeat PSA testing in 6-8 weeks to calculate PSA velocity. A rise >0.75 ng/mL/year is concerning and may indicate cancer progression.`,
      priority: "important",
    });
  }

  if (patient.bmi >= 30) {
    recommendations.push({
      category: "Lifestyle",
      icon: "⚖️",
      title: "Weight Management Program",
      description: `BMI of ${patient.bmi} places the patient in the obese category. A structured weight loss program targeting BMI <25 can reduce cancer risk by up to 20%. Recommend dietitian referral.`,
      priority: "important",
    });
  }

  if (patient.smoking) {
    recommendations.push({
      category: "Lifestyle",
      icon: "🚭",
      title: "Smoking Cessation Program",
      description: "Smoking cessation can reduce fatal prostate cancer risk by 30% within 10 years. Prescribe nicotine replacement therapy and consider behavioral support resources.",
      priority: "important",
    });
  }

  if (patient.activityLevel === 0) {
    recommendations.push({
      category: "Lifestyle",
      icon: "🏃",
      title: "Exercise Protocol",
      description: "Introduce 150 minutes/week of moderate-intensity aerobic activity. Studies show regular exercise reduces aggressive prostate cancer risk by 25-30%. Start with daily 30-min walks.",
      priority: "suggested",
    });
  }

  if (patient.sleepHours < 6) {
    recommendations.push({
      category: "Lifestyle",
      icon: "😴",
      title: "Sleep Optimization",
      description: `Currently averaging ${patient.sleepHours} hours. Target 7-8 hours of quality sleep. Address potential sleep apnea, reduce evening screen time, and maintain consistent sleep/wake schedule.`,
      priority: "suggested",
    });
  }

  if (patient.alcohol) {
    recommendations.push({
      category: "Lifestyle",
      icon: "🍷",
      title: "Alcohol Moderation",
      description: "Limit alcohol intake to ≤2 drinks per day. Complete abstinence is recommended during active surveillance or treatment periods.",
      priority: "suggested",
    });
  }

  // General screenings
  recommendations.push({
    category: "Screening",
    icon: "📅",
    title: "Regular PSA Monitoring",
    description: patient.risk >= 2
      ? "Given elevated risk, PSA should be monitored every 3-6 months with digital rectal examination."
      : "Annual PSA screening is recommended. Maintain regular primary care visits for comprehensive health monitoring.",
    priority: patient.risk >= 2 ? "important" : "suggested",
  });

  // Calculate composite risk score (0-100)
  let riskScore = patient.risk * 25; // base from ML classification
  if (patient.psa > 4) riskScore += 10;
  if (patient.familyHistory) riskScore += 8;
  if (patient.smoking) riskScore += 5;
  if (patient.bmi > 30) riskScore += 5;
  if (patient.age > 70) riskScore += 7;
  riskScore = Math.min(riskScore, 100);

  // Summary
  const summaries: Record<number, string> = {
    0: `This patient presents a low risk profile. At age ${patient.age} with a PSA of ${patient.psa} ng/mL, the ML model classifies this case as low risk. Standard screening protocols are sufficient.`,
    1: `This patient has a moderate risk profile warranting enhanced monitoring. Key factors include age (${patient.age}), PSA (${patient.psa} ng/mL)${patient.familyHistory ? ', and positive family history' : ''}. Regular follow-up is recommended.`,
    2: `This patient has been flagged as high risk by the ML classifier. PSA of ${patient.psa} ng/mL${patient.familyHistory ? ' combined with positive family history' : ''} and age ${patient.age} contribute to the elevated risk. Further diagnostic workup is recommended.`,
    3: `CRITICAL: This patient requires urgent clinical attention. The combination of ${patient.psa >= 4 ? `elevated PSA (${patient.psa} ng/mL)` : `clinical features`}${patient.familyHistory ? ', positive family history' : ''}, and age ${patient.age} yields a critical risk classification. Immediate urology referral is indicated.`,
  };

  return {
    summary: summaries[patient.risk] || summaries[0],
    riskFactors,
    protectiveFactors,
    recommendations,
    riskScore,
  };
}
