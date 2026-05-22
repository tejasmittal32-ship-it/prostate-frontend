/**
 * Prostate AI — Patient Data Module
 * ===================================
 * A representative sample of real patient records from the CSV dataset.
 * Used to power the Dashboard analytics and Patient History table.
 * 
 * In production, this would be fetched from a database.
 * For demo purposes, we embed a curated sample.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  familyHistory: boolean;
  smoking: boolean;
  activityLevel: number;
  psa: number;
  region: number;
  diet: number;
  pollution: number;
  bmi: number;
  alcohol: boolean;
  sleepHours: number;
  risk: number;           // 0-3
  assessmentDate: string;
}

// ── Name generation (deterministic from index) ────────────────────────────────

const FIRST_NAMES = [
  "Robert", "Michael", "David", "James", "William", "Richard", "Charles",
  "Thomas", "Daniel", "Matthew", "Anthony", "Mark", "Steven", "Paul",
  "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Timothy",
  "Ronald", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary",
  "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott",
  "Brandon", "Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander",
  "Patrick", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Nathan",
];

const LAST_NAMES = [
  "Harrison", "Chen", "Miller", "Wilson", "Davis", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
  "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee",
  "Walker", "Hall", "Allen", "Young", "King", "Wright", "Lopez", "Hill",
  "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter",
  "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker",
  "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers",
];

function generateName(index: number): string {
  return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]}`;
}

function generateDate(index: number): string {
  const base = new Date("2026-04-09");
  base.setDate(base.getDate() - index);
  return base.toISOString().split("T")[0];
}

// ── Raw CSV rows (sampled representative subset) ──────────────────────────────
// These are real rows from prostate_cancer_data.csv

const RAW_DATA: number[][] = [
  // [age, family_history, smoking, activity, psa, region, diet, pollution, bmi, alcohol, sleep, risk]
  [65, 0, 0, 1, 0.96, 1, 1, 2, 28.2, 1, 6.5, 1],
  [60, 0, 1, 1, 0.93, 1, 2, 2, 30.0, 0, 7.4, 0],
  [68, 0, 0, 0, 1.63, 1, 1, 0, 27.0, 0, 7.0, 0],
  [79, 1, 1, 0, 3.86, 2, 2, 0, 34.5, 1, 4.5, 3],
  [77, 0, 0, 1, 2.03, 0, 0, 0, 23.4, 1, 6.2, 1],
  [66, 1, 1, 2, 4.59, 0, 0, 1, 27.4, 1, 6.4, 2],
  [50, 1, 0, 0, 1.46, 2, 2, 2, 31.4, 1, 6.0, 3],
  [69, 1, 0, 2, 2.29, 2, 2, 1, 29.7, 1, 6.1, 2],
  [66, 0, 1, 0, 2.59, 1, 2, 1, 33.8, 1, 7.3, 1],
  [54, 0, 0, 2, 4.66, 0, 1, 1, 29.3, 1, 6.7, 1],
  [70, 0, 1, 0, 3.34, 2, 0, 0, 32.7, 1, 4.0, 2],
  [58, 0, 0, 2, 1.69, 2, 2, 2, 30.9, 1, 6.1, 1],
  [57, 0, 0, 1, 0.99, 1, 0, 1, 24.0, 0, 6.6, 0],
  [62, 0, 0, 2, 1.67, 1, 1, 1, 26.1, 0, 6.9, 0],
  [65, 0, 0, 1, 0.98, 0, 0, 0, 19.3, 0, 6.7, 0],
  [71, 1, 0, 2, 7.21, 0, 1, 0, 32.0, 0, 5.6, 2],
  [57, 0, 0, 1, 1.67, 0, 0, 2, 27.7, 0, 7.4, 0],
  [68, 1, 0, 0, 1.61, 0, 1, 1, 32.5, 0, 7.1, 2],
  [66, 0, 1, 1, 1.23, 1, 2, 2, 29.3, 0, 6.4, 2],
  [66, 1, 1, 0, 4.32, 1, 2, 1, 33.1, 0, 6.4, 3],
  [66, 0, 0, 2, 1.74, 0, 1, 0, 29.4, 1, 6.9, 1],
  [65, 1, 0, 0, 1.3, 0, 0, 0, 25.3, 0, 6.8, 2],
  [63, 1, 0, 1, 1.16, 2, 2, 1, 18.8, 0, 6.1, 1],
  [61, 0, 0, 0, 0.79, 0, 1, 1, 26.0, 1, 8.1, 1],
  [77, 0, 0, 0, 7.8, 1, 2, 2, 28.9, 0, 6.1, 3],
  [61, 0, 0, 1, 1.65, 2, 0, 2, 29.0, 0, 6.8, 1],
  [63, 0, 0, 1, 0.41, 0, 0, 0, 24.4, 0, 5.4, 0],
  [61, 1, 1, 1, 2.64, 1, 1, 2, 20.0, 0, 6.7, 2],
  [59, 1, 1, 0, 2.49, 1, 2, 2, 33.8, 0, 7.0, 3],
  [47, 1, 1, 2, 1.16, 0, 0, 1, 25.9, 1, 6.8, 1],
  [61, 0, 0, 0, 2.47, 1, 1, 2, 21.4, 0, 7.4, 0],
  [48, 0, 0, 0, 0.81, 0, 0, 2, 25.2, 0, 4.7, 0],
  [65, 1, 1, 1, 1.32, 2, 1, 2, 24.0, 0, 6.6, 1],
  [60, 0, 0, 0, 1.02, 2, 0, 1, 30.6, 1, 6.6, 1],
  [47, 1, 1, 1, 0.83, 0, 1, 1, 27.1, 0, 7.9, 1],
  [54, 0, 1, 0, 1.28, 2, 1, 1, 30.5, 0, 5.1, 1],
  [55, 0, 1, 2, 2.7, 1, 2, 2, 29.8, 0, 7.3, 1],
  [56, 1, 1, 0, 1.08, 1, 1, 2, 24.3, 0, 6.5, 2],
  [62, 0, 0, 2, 4.24, 0, 0, 1, 24.7, 0, 7.5, 0],
  [60, 0, 0, 0, 0.98, 2, 1, 2, 26.1, 1, 4.3, 1],
  [76, 0, 0, 0, 1.68, 0, 0, 0, 19.7, 0, 7.7, 0],
  [62, 0, 0, 2, 1.72, 0, 0, 0, 24.9, 0, 5.9, 0],
  [60, 1, 0, 0, 1.81, 2, 2, 2, 27.5, 0, 7.6, 1],
  [54, 0, 0, 0, 1.43, 1, 0, 2, 23.6, 1, 7.2, 0],
  [66, 0, 0, 0, 2.29, 2, 0, 2, 25.6, 0, 4.0, 1],
  [70, 1, 0, 1, 1.06, 0, 0, 2, 27.0, 0, 5.2, 1],
  [59, 0, 1, 1, 0.76, 0, 0, 0, 24.2, 0, 6.3, 0],
  [78, 0, 0, 0, 4.66, 2, 2, 2, 35.4, 0, 5.5, 3],
  [57, 0, 0, 1, 0.48, 0, 0, 0, 26.4, 0, 5.3, 0],
  [66, 0, 0, 0, 1.36, 2, 2, 2, 30.5, 0, 6.1, 2],
  [71, 1, 0, 0, 9.45, 2, 1, 1, 27.7, 1, 6.5, 3],
  [58, 0, 0, 1, 1.28, 2, 2, 2, 30.2, 1, 4.8, 2],
  [53, 1, 0, 1, 0.81, 0, 1, 1, 28.8, 1, 4.9, 1],
  [57, 0, 0, 2, 1.33, 0, 1, 2, 29.9, 0, 5.9, 0],
  [65, 0, 0, 0, 2.36, 2, 2, 1, 28.7, 0, 6.6, 0],
  [67, 0, 0, 0, 2.25, 2, 2, 1, 31.0, 0, 5.6, 1],
  [58, 1, 1, 1, 2.36, 1, 1, 1, 27.4, 0, 8.0, 1],
  [70, 0, 1, 1, 3.34, 1, 1, 2, 27.5, 0, 7.0, 1],
  [83, 0, 1, 0, 8.23, 1, 1, 1, 25.9, 0, 6.2, 3],
  [54, 1, 0, 2, 1.1, 1, 1, 0, 24.4, 0, 7.4, 1],
  [76, 1, 0, 0, 1.56, 2, 1, 2, 29.9, 1, 4.0, 3],
  [62, 0, 0, 1, 1.16, 2, 2, 2, 29.9, 0, 5.9, 1],
  [54, 0, 0, 2, 1.04, 2, 1, 1, 23.2, 0, 6.7, 0],
  [69, 0, 0, 2, 2.41, 1, 0, 2, 22.8, 0, 7.2, 1],
  [70, 1, 1, 1, 1.76, 2, 0, 1, 23.8, 1, 5.6, 2],
  [74, 0, 0, 0, 1.72, 0, 1, 0, 26.5, 1, 6.3, 1],
  [71, 1, 0, 2, 4.51, 0, 0, 0, 24.0, 0, 6.6, 1],
  [57, 0, 0, 0, 0.48, 1, 1, 2, 25.2, 0, 6.5, 0],
  [56, 1, 0, 0, 0.84, 2, 0, 2, 24.4, 0, 6.5, 1],
  [74, 0, 0, 0, 2.38, 1, 2, 0, 32.7, 0, 6.8, 2],
  [63, 0, 1, 2, 2.54, 0, 1, 0, 22.2, 0, 7.6, 1],
  [57, 0, 1, 1, 7.4, 2, 1, 2, 23.8, 0, 6.8, 2],
  [70, 1, 0, 2, 3.52, 0, 0, 1, 22.4, 0, 5.7, 1],
  [61, 1, 1, 0, 1.63, 2, 1, 2, 29.0, 1, 5.7, 3],
  [69, 0, 0, 1, 1.81, 0, 1, 0, 21.8, 0, 7.4, 0],
  [54, 0, 0, 2, 0.42, 2, 2, 1, 25.6, 0, 7.6, 0],
  [63, 0, 0, 2, 1.19, 1, 1, 1, 29.6, 0, 9.2, 1],
  [51, 0, 0, 0, 1.52, 0, 1, 1, 27.4, 0, 6.6, 0],
  [79, 1, 1, 0, 4.66, 2, 2, 2, 33.0, 0, 4.5, 3],
  [81, 1, 0, 0, 3.2, 1, 0, 0, 23.4, 0, 7.1, 2],
  [67, 1, 1, 1, 4.25, 1, 1, 0, 29.6, 1, 7.4, 3],
  [56, 0, 1, 0, 1.73, 2, 2, 2, 31.1, 1, 5.9, 1],
  [78, 1, 0, 0, 3.23, 1, 1, 1, 30.9, 0, 7.4, 2],
  [55, 1, 1, 0, 3.0, 2, 2, 2, 27.7, 1, 5.8, 2],
  [71, 0, 1, 0, 4.28, 2, 1, 1, 24.4, 0, 4.9, 2],
  [63, 0, 1, 0, 0.98, 2, 1, 1, 27.0, 0, 4.9, 1],
  [64, 1, 1, 2, 2.37, 1, 0, 1, 21.9, 0, 6.9, 2],
  [79, 1, 1, 0, 8.42, 1, 1, 2, 26.6, 0, 7.1, 3],
  [68, 0, 0, 2, 1.37, 2, 2, 0, 28.4, 0, 6.4, 1],
  [85, 0, 1, 0, 0.91, 0, 0, 1, 29.5, 1, 6.1, 2],
  [57, 1, 0, 0, 1.28, 2, 2, 2, 25.3, 0, 5.0, 2],
  [65, 0, 0, 0, 4.3, 2, 1, 2, 33.6, 1, 4.8, 2],
  [60, 1, 1, 2, 1.78, 2, 2, 2, 26.2, 0, 8.5, 2],
  [85, 1, 0, 0, 5.71, 2, 2, 2, 32.6, 0, 5.1, 3],
  [75, 0, 1, 1, 1.72, 2, 2, 2, 27.9, 0, 6.4, 2],
  [66, 1, 0, 0, 2.29, 1, 1, 1, 32.9, 1, 7.3, 2],
  [52, 1, 0, 1, 1.86, 0, 0, 2, 24.8, 0, 7.2, 1],
  [56, 1, 0, 2, 1.48, 0, 0, 0, 24.4, 1, 5.6, 0],
  // Additional records for expanded dataset
  [72, 0, 0, 1, 1.98, 0, 1, 2, 30.1, 0, 6.3, 1],
  [71, 0, 1, 0, 2.92, 0, 0, 0, 28.6, 0, 5.3, 3],
  [62, 0, 0, 1, 1.17, 0, 0, 0, 21.9, 0, 6.1, 0],
  [53, 0, 0, 0, 1.52, 1, 1, 1, 24.6, 0, 6.7, 0],
  [79, 1, 0, 0, 5.86, 1, 2, 1, 29.1, 0, 5.2, 3],
  [52, 0, 0, 1, 0.79, 0, 1, 0, 23.1, 0, 8.2, 0],
  [68, 0, 1, 0, 2.51, 2, 2, 2, 37.2, 1, 6.3, 3],
  [57, 1, 1, 0, 3.06, 2, 2, 2, 18.5, 0, 6.0, 2],
  [71, 1, 1, 0, 3.15, 2, 1, 1, 33.9, 1, 5.4, 3],
  [67, 0, 0, 0, 1.93, 2, 2, 2, 28.3, 0, 4.6, 1],
  [77, 0, 0, 0, 1.8, 0, 1, 0, 18.7, 0, 6.1, 2],
  [71, 0, 1, 0, 1.53, 2, 1, 2, 29.4, 0, 6.8, 1],
  [65, 0, 0, 0, 1.59, 2, 2, 0, 35.8, 0, 7.5, 1],
  [70, 0, 0, 0, 8.05, 0, 0, 0, 24.1, 0, 6.4, 2],
  [77, 0, 1, 0, 1.83, 1, 1, 2, 28.8, 1, 6.1, 2],
  [58, 0, 0, 0, 0.47, 1, 0, 2, 23.1, 1, 4.7, 1],
  [75, 0, 0, 0, 1.19, 0, 1, 0, 35.7, 0, 5.0, 1],
  [56, 0, 0, 0, 1.19, 2, 1, 2, 23.9, 1, 4.9, 1],
  [74, 0, 0, 0, 1.84, 0, 2, 0, 25.9, 0, 6.5, 0],
  [66, 0, 1, 0, 2.6, 0, 1, 0, 30.0, 0, 7.0, 1],
  [56, 0, 1, 0, 2.98, 1, 1, 1, 33.4, 0, 5.4, 1],
  [72, 1, 0, 0, 1.99, 2, 1, 0, 30.0, 1, 5.1, 3],
  [70, 0, 0, 1, 1.11, 1, 1, 1, 28.8, 0, 6.3, 1],
  [47, 0, 1, 1, 1.71, 1, 1, 2, 27.8, 1, 7.3, 1],
  [73, 0, 0, 1, 6.42, 1, 2, 0, 28.9, 1, 5.6, 1],
  [68, 0, 1, 0, 0.96, 1, 1, 0, 19.2, 0, 7.8, 1],
  [62, 0, 1, 1, 1.19, 1, 0, 2, 26.5, 0, 6.2, 1],
  [81, 1, 0, 0, 3.84, 1, 0, 1, 24.6, 1, 6.3, 1],
  [63, 0, 1, 0, 1.11, 2, 1, 2, 23.5, 0, 6.2, 0],
  [54, 0, 1, 1, 2.38, 1, 0, 1, 20.4, 0, 6.5, 0],
  [78, 0, 1, 1, 3.25, 2, 1, 1, 29.8, 0, 8.3, 2],
  [48, 0, 1, 1, 1.02, 2, 2, 2, 27.8, 0, 6.6, 1],
  [67, 0, 0, 2, 1.22, 0, 0, 0, 21.7, 0, 6.5, 0],
  [57, 1, 0, 2, 2.42, 0, 0, 1, 22.5, 0, 5.8, 0],
  [75, 0, 1, 0, 2.88, 2, 2, 0, 30.7, 0, 6.9, 2],
  [53, 0, 1, 1, 1.22, 2, 1, 2, 27.8, 0, 6.1, 1],
  [60, 0, 1, 0, 1.57, 1, 0, 1, 26.9, 0, 6.2, 0],
  [50, 0, 0, 0, 0.77, 1, 2, 2, 31.6, 0, 5.2, 1],
  [73, 0, 1, 0, 2.19, 1, 0, 0, 26.1, 0, 7.0, 2],
  [50, 1, 0, 1, 2.08, 0, 0, 1, 22.5, 1, 6.7, 1],
  [58, 1, 0, 0, 0.86, 1, 0, 1, 26.6, 1, 4.5, 2],
  [57, 1, 0, 1, 1.36, 2, 2, 2, 39.5, 1, 5.6, 2],
  [62, 1, 0, 0, 1.8, 1, 0, 1, 33.6, 1, 6.4, 2],
  [40, 1, 0, 0, 1.06, 0, 1, 0, 18.0, 0, 6.9, 1],
  [59, 0, 1, 0, 1.39, 2, 2, 1, 32.8, 1, 5.8, 2],
  [68, 0, 0, 0, 3.49, 1, 2, 2, 33.5, 0, 7.5, 2],
  [80, 0, 0, 0, 3.33, 2, 2, 2, 30.4, 0, 5.0, 2],
  [66, 1, 0, 0, 3.2, 2, 2, 2, 32.7, 0, 4.6, 3],
  [52, 1, 1, 0, 7.01, 1, 1, 1, 34.8, 1, 4.4, 3],
  [69, 1, 0, 1, 6.21, 0, 2, 1, 30.6, 0, 5.7, 2],
  [75, 1, 0, 0, 2.44, 0, 0, 1, 25.6, 0, 7.1, 1],
  [60, 1, 0, 1, 1.63, 1, 0, 1, 27.7, 0, 7.8, 1],
  [57, 0, 0, 0, 6.19, 2, 2, 2, 26.5, 0, 5.9, 2],
  [64, 0, 0, 0, 1.48, 2, 0, 1, 31.0, 0, 5.3, 1],
  [71, 0, 0, 0, 7.49, 2, 2, 2, 34.6, 0, 5.2, 3],
  [60, 0, 0, 0, 0.7, 2, 0, 2, 28.7, 0, 5.3, 1],
  [67, 0, 0, 1, 0.68, 0, 2, 1, 34.3, 0, 5.9, 1],
  [60, 1, 0, 1, 2.19, 1, 1, 1, 24.8, 0, 5.8, 0],
];

// ── Build typed patient records ────────────────────────────────────────────────

export const patients: PatientRecord[] = RAW_DATA.map((row, i) => ({
  id: `PAT-${(8900 + i).toString()}`,
  name: generateName(i),
  age: row[0],
  familyHistory: row[1] === 1,
  smoking: row[2] === 1,
  activityLevel: row[3],
  psa: row[4],
  region: row[5],
  diet: row[6],
  pollution: row[7],
  bmi: row[8],
  alcohol: row[9] === 1,
  sleepHours: row[10],
  risk: row[11],
  assessmentDate: generateDate(i),
}));

// ── Computed Analytics ─────────────────────────────────────────────────────────

export function getStats() {
  const total = patients.length;
  const routine = patients.filter(p => p.risk === 0).length;
  const moderate = patients.filter(p => p.risk === 1).length;
  const high = patients.filter(p => p.risk === 2).length;
  const critical = patients.filter(p => p.risk === 3).length;

  return { total, routine, moderate, high, critical };
}

export function getRiskLabel(risk: number): string {
  const map: Record<number, string> = {
    0: "Routine Clearance",
    1: "Moderate Risk",
    2: "High Risk",
    3: "Critical Detection",
  };
  return map[risk] ?? "Unknown";
}

export function getRiskStyle(risk: number): string {
  const map: Record<number, string> = {
    0: "bg-emerald-50 text-emerald-700",
    1: "bg-blue-50 text-blue-700",
    2: "bg-amber-50 text-amber-700",
    3: "bg-rose-50 text-rose-700",
  };
  return map[risk] ?? "bg-slate-50 text-slate-700";
}

/** PSA distribution for chart */
export function getPsaDistribution() {
  const buckets = [
    { name: "0-1", count: 0 },
    { name: "1-2", count: 0 },
    { name: "2-3", count: 0 },
    { name: "3-4", count: 0 },
    { name: "4-6", count: 0 },
    { name: "6+", count: 0 },
  ];

  patients.forEach(p => {
    if (p.psa < 1) buckets[0].count++;
    else if (p.psa < 2) buckets[1].count++;
    else if (p.psa < 3) buckets[2].count++;
    else if (p.psa < 4) buckets[3].count++;
    else if (p.psa < 6) buckets[4].count++;
    else buckets[5].count++;
  });

  return buckets;
}

/** Risk distribution for chart */
export function getRiskDistribution() {
  return [
    { name: "Low", count: patients.filter(p => p.risk === 0).length },
    { name: "Moderate", count: patients.filter(p => p.risk === 1).length },
    { name: "High", count: patients.filter(p => p.risk === 2).length },
    { name: "Critical", count: patients.filter(p => p.risk === 3).length },
  ];
}

/** Find a patient by their ID */
export function getPatientById(id: string): PatientRecord | undefined {
  return patients.find(p => p.id === id);
}

