"""
Synthetic Data Generator for Prostate Cancer Risk Stratification
================================================================
Generates 10,000 realistic patient records with medically-grounded
interdependencies between features. Inspired by clinical PSA reference
ranges, epidemiological data, and Kaggle health dataset patterns.

Target: risk (0=Low, 1=Mild, 2=Moderate, 3=High)
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path


# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
SEED = 42
N_SAMPLES = 10_000
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "generated"
OUTPUT_FILE = OUTPUT_DIR / "prostate_cancer_data.csv"

COLUMNS = [
    "age", "family_history", "smoking", "activity_level", "psa",
    "region", "diet", "pollution", "bmi", "alcohol", "sleep_hours", "risk",
]


def _sigmoid(x: float) -> float:
    """Numerically-stable sigmoid for smooth probability transitions."""
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))


def generate_dataset(n: int = N_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    """
    Generate a synthetic prostate cancer risk dataset.

    Returns
    -------
    pd.DataFrame with columns defined in COLUMNS.
    """
    rng = np.random.default_rng(seed)
    data = []

    for _ in range(n):
        # ─── AGE ───────────────────────────────────────
        # Skewed-normal towards 55-70 (peak screening age)
        age = int(np.clip(rng.normal(loc=62, scale=10), 40, 85))

        # ─── REGION ───────────────────────────────────
        # 0=Rural, 1=Semi-Urban, 2=Urban
        region = rng.choice([0, 1, 2], p=[0.35, 0.30, 0.35])

        # ─── FAMILY HISTORY ───────────────────────────
        # ~20-25% prevalence; slightly higher in older cohorts
        fam_prob = 0.20 + 0.003 * max(0, age - 55)
        family = int(rng.random() < np.clip(fam_prob, 0.15, 0.35))

        # ─── DIET ─────────────────────────────────────
        # 0=Healthy, 1=Moderate, 2=Unhealthy (region-influenced)
        diet_probs = {
            0: [0.50, 0.35, 0.15],   # Rural  → healthier
            1: [0.30, 0.45, 0.25],   # Semi-urban
            2: [0.15, 0.40, 0.45],   # Urban  → more processed
        }
        diet = rng.choice([0, 1, 2], p=diet_probs[region])

        # ─── ALCOHOL ──────────────────────────────────
        # 0=None, 1=Regular  (region + age modulated)
        base_alc = {0: 0.18, 1: 0.28, 2: 0.38}[region]
        if age > 65:
            base_alc *= 0.75       # Older men tend to reduce intake
        alcohol = int(rng.random() < base_alc)

        # ─── SMOKING ─────────────────────────────────
        # 0=Non-smoker, 1=Smoker  (region + age influenced)
        base_smoke = {0: 0.22, 1: 0.30, 2: 0.35}[region]
        if age > 70:
            base_smoke *= 0.80     # Survivor bias / cessation
        smoking = int(rng.random() < base_smoke)

        # ─── SLEEP HOURS ─────────────────────────────
        sleep = rng.normal(7.0, 1.0)
        if region == 2:
            sleep -= rng.uniform(0.3, 0.9)   # Urban stress
        if alcohol == 1:
            sleep -= rng.uniform(0.2, 0.7)
        if age > 65:
            sleep -= rng.uniform(0.1, 0.5)   # Age-related decline
        if smoking == 1:
            sleep -= rng.uniform(0.1, 0.4)
        sleep = round(float(np.clip(sleep, 4.0, 9.5)), 1)

        # ─── BMI ─────────────────────────────────────
        bmi = rng.normal(25.0, 3.5)
        if diet == 2:
            bmi += rng.uniform(1.5, 4.5)
        elif diet == 1:
            bmi += rng.uniform(0.0, 1.5)
        if alcohol == 1:
            bmi += rng.uniform(0.5, 2.5)
        if sleep < 6.0:
            bmi += rng.uniform(0.5, 2.0)
        if age > 60:
            bmi += rng.uniform(0.0, 1.5)     # Age-related metabolism
        bmi = round(float(np.clip(bmi, 18.0, 42.0)), 1)

        # ─── ACTIVITY LEVEL ──────────────────────────
        # 0=Low, 1=Moderate, 2=High
        act_probs = {
            0: [0.20, 0.35, 0.45],   # Rural  → more physical work
            1: [0.30, 0.45, 0.25],   # Semi-urban
            2: [0.45, 0.40, 0.15],   # Urban  → sedentary
        }
        activity = rng.choice([0, 1, 2], p=act_probs[region])

        # BMI and sleep modify activity downward
        if bmi > 32:
            activity = max(0, activity - 1)
        if sleep < 5.5:
            activity = max(0, activity - 1)
        if age > 72:
            activity = max(0, activity - 1)

        # ─── POLLUTION ───────────────────────────────
        # 0=Low, 1=Moderate, 2=High
        poll_probs = {
            0: [0.60, 0.30, 0.10],
            1: [0.20, 0.50, 0.30],
            2: [0.08, 0.37, 0.55],
        }
        pollution = rng.choice([0, 1, 2], p=poll_probs[region])

        # ─── PSA (ng/mL) ─────────────────────────────
        # Clinically-grounded: age-specific median with log-normal tail
        #
        # Reference medians (approximate):
        #   40-49: ~0.7   50-59: ~1.0   60-69: ~1.4   70-79: ~2.0
        # We model PSA on a log scale for realistic right-skewed distribution
        #
        age_factor = 0.02 * (age - 40)       # Gradual age effect
        log_psa_mean = -0.2 + age_factor      # ~0.8 at 40, ~1.5 at 65

        # Family history shifts the distribution
        if family == 1:
            log_psa_mean += rng.uniform(0.15, 0.40)

        # Lifestyle modifiers (subtle, not dominant)
        if smoking == 1:
            log_psa_mean += rng.uniform(0.05, 0.20)
        if bmi > 30:
            log_psa_mean += rng.uniform(0.05, 0.18)
        if alcohol == 1:
            log_psa_mean += rng.uniform(0.0, 0.10)

        # Sample from log-normal (natural right skew)
        log_psa = rng.normal(log_psa_mean, 0.45)
        psa = float(np.exp(log_psa))

        # Rare outlier spike (~5% chance): prostatitis, BPH, etc.
        if rng.random() < 0.05:
            psa += rng.uniform(2.0, 8.0)

        psa = round(float(np.clip(psa, 0.3, 30.0)), 2)

        # ──────────────────────────────────────────────
        # RISK SCORING (weighted, with controlled noise)
        # ──────────────────────────────────────────────
        risk_score = 0.0

        # ── STRONG PREDICTORS ──
        # Age (smooth contribution via sigmoid bands)
        if age >= 72:
            risk_score += 3.0
        elif age >= 63:
            risk_score += 1.5 + 1.5 * _sigmoid((age - 67) / 2.0)
        elif age >= 50:
            risk_score += 0.5 + 1.0 * _sigmoid((age - 56) / 3.0)

        # PSA (log-scaled to avoid sharp cutoffs)
        if psa >= 10.0:
            risk_score += 4.0 + min(1.5, (psa - 10) / 8.0)
        elif psa >= 4.0:
            risk_score += 1.5 + 2.5 * _sigmoid((psa - 6.5) / 1.5)
        elif psa >= 2.5:
            risk_score += 0.5 * _sigmoid((psa - 3.0) / 0.5)

        # Family history
        if family == 1:
            risk_score += 2.5 + rng.uniform(0, 0.5)

        # ── MODERATE PREDICTORS ──
        if smoking == 1:
            risk_score += 1.0 + rng.uniform(0, 0.5)

        # BMI (smooth contribution)
        if bmi > 30:
            risk_score += 1.0 + min(1.5, (bmi - 30) / 6.0)
        elif bmi > 25:
            risk_score += 0.3 + 0.7 * _sigmoid((bmi - 27.5) / 2.0)

        if activity == 0:
            risk_score += 1.5
        elif activity == 1:
            risk_score += 0.5

        # ── CONTEXTUAL PREDICTORS ──
        if pollution == 2:
            risk_score += 0.8 + rng.uniform(0, 0.3)
        elif pollution == 1:
            risk_score += 0.3

        if diet == 2:
            risk_score += 0.7 + rng.uniform(0, 0.3)
        elif diet == 1:
            risk_score += 0.2

        if alcohol == 1:
            risk_score += 0.5 + rng.uniform(0, 0.3)

        if sleep < 5.5:
            risk_score += 0.8 + rng.uniform(0, 0.3)
        elif sleep < 6.5:
            risk_score += 0.3

        # ── CONTROLLED NOISE ──────
        # Gaussian noise to prevent determinism, clipped for stability
        noise = rng.normal(0, 1.2)
        risk_score += noise

        # ──────────────────────────────────────────────
        # RISK CLASS (asymmetric thresholds → class imbalance)
        # ──────────────────────────────────────────────
        # Designed to produce approx: 40% Low, 30% Mild, 20% Moderate, 10% High
        if risk_score <= 4.5:
            risk = 0    # Low
        elif risk_score <= 7.5:
            risk = 1    # Mild
        elif risk_score <= 10.5:
            risk = 2    # Moderate
        else:
            risk = 3    # High

        # ─── APPEND RECORD ───────────────────────────
        data.append([
            age, family, smoking, activity, psa,
            region, diet, pollution, bmi, alcohol, sleep, risk
        ])

    # ─── BUILD DATAFRAME ─────────────────────────
    df = pd.DataFrame(data, columns=COLUMNS)

    # Ensure correct dtypes
    int_cols = ["age", "family_history", "smoking", "activity_level",
                "region", "diet", "pollution", "alcohol", "risk"]
    for c in int_cols:
        df[c] = df[c].astype(int)

    return df


def save_dataset(df: pd.DataFrame, path: Path = OUTPUT_FILE) -> Path:
    """Save the generated dataset to CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return path


def print_summary(df: pd.DataFrame) -> None:
    """Print dataset summary statistics."""
    print("=" * 60)
    print("  PROSTATE CANCER RISK - SYNTHETIC DATASET SUMMARY")
    print("=" * 60)

    print(f"\n  Samples: {len(df):,}")
    print(f"  Features: {len(df.columns) - 1}")
    print(f"  Target: risk (0=Low, 1=Mild, 2=Moderate, 3=High)\n")

    print("-" * 40)
    print("  CLASS DISTRIBUTION")
    print("-" * 40)
    labels = {0: "Low", 1: "Mild", 2: "Moderate", 3: "High"}
    counts = df["risk"].value_counts().sort_index()
    for cls, count in counts.items():
        pct = 100 * count / len(df)
        bar = "#" * int(pct / 2)
        print(f"  {labels[cls]:>8} (risk={cls}): {count:>5}  ({pct:5.1f}%)  {bar}")
    print()

    print("-" * 40)
    print("  FEATURE STATISTICS")
    print("-" * 40)
    print(df.describe().round(2).to_string())
    print()

    print("-" * 40)
    print("  FIRST 10 ROWS")
    print("-" * 40)
    print(df.head(10).to_string(index=False))
    print()


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    df = generate_dataset()
    output_path = save_dataset(df)
    print_summary(df)
    print(f"  [OK] Dataset saved to: {output_path}")
