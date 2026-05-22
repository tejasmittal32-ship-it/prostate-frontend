"""
Explainability Module for Prostate Cancer Risk Stratification
==============================================================
Provides local (per-patient) and global feature-importance explanations
using Logistic Regression coefficients. All outputs are JSON-serializable
and designed for direct API integration.

Usage:
    from src.explainability import load_artifacts, predict_risk, get_global_importance

    artifacts = load_artifacts()
    result = predict_risk(patient_features, artifacts)
    global_imp = get_global_importance(artifacts)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BUNDLE_PATH = PROJECT_ROOT / "models" / "model_bundle.joblib"
SCALER_PATH = PROJECT_ROOT / "models" / "scaler.joblib"
GLOBAL_IMPORTANCE_PATH = PROJECT_ROOT / "models" / "global_feature_importance.csv"

RISK_LABELS: dict[int, str] = {0: "Low", 1: "Mild", 2: "Moderate", 3: "High"}

# Numeric features that require scaling (must match preprocessing.py)
NUMERIC_FEATURES = ["age", "psa", "bmi", "sleep_hours", "psa_density"]

# Human-friendly display names for explanation sentences
FEATURE_DISPLAY_NAMES: dict[str, str] = {
    "age": "age",
    "psa": "PSA level",
    "bmi": "BMI",
    "sleep_hours": "sleep duration",
    "psa_density": "PSA density",
    "family_history": "family history",
    "smoking": "smoking status",
    "activity_level": "activity level",
    "region": "region",
    "diet": "diet quality",
    "pollution": "pollution exposure",
    "alcohol": "alcohol consumption",
}


# ──────────────────────────────────────────────
# ARTIFACT LOADING
# ──────────────────────────────────────────────
def load_artifacts(
    bundle_path: Path = BUNDLE_PATH,
    scaler_path: Path = SCALER_PATH,
) -> dict[str, Any]:
    """
    Load the saved model bundle and scaler from disk.

    Returns
    -------
    dict with keys:
        - model : LogisticRegression (fitted)
        - feature_names : list[str]
        - scaler : StandardScaler (fitted)
    """
    bundle_path = Path(bundle_path)
    scaler_path = Path(scaler_path)

    if not bundle_path.exists():
        raise FileNotFoundError(
            f"Model bundle not found at {bundle_path}. "
            "Run train.py first to create it."
        )
    if not scaler_path.exists():
        raise FileNotFoundError(
            f"Scaler not found at {scaler_path}. "
            "Run preprocessing.py first to create it."
        )

    bundle = joblib.load(bundle_path)
    scaler = joblib.load(scaler_path)

    return {
        "model": bundle["model"],
        "feature_names": bundle["feature_names"],
        "scaler": scaler,
    }


# ──────────────────────────────────────────────
# SCALING HELPER
# ──────────────────────────────────────────────
def _scale_input(
    raw_features: np.ndarray,
    feature_names: list[str],
    scaler,
) -> np.ndarray:
    """
    Apply the saved StandardScaler to numeric features only.

    Parameters
    ----------
    raw_features : np.ndarray, shape (n_samples, n_features)
    feature_names : list[str]
    scaler : fitted StandardScaler

    Returns
    -------
    np.ndarray with numeric columns scaled, categorical columns unchanged.
    """
    X = raw_features.copy().astype(float)

    # Identify indices of numeric features that the scaler expects
    numeric_indices = [
        i for i, name in enumerate(feature_names) if name in NUMERIC_FEATURES
    ]

    if numeric_indices:
        X[:, numeric_indices] = scaler.transform(X[:, numeric_indices])

    return X


# ──────────────────────────────────────────────
# LOCAL EXPLANATION: FEATURE CONTRIBUTIONS
# ──────────────────────────────────────────────
def compute_contributions(
    scaled_sample: np.ndarray,
    predicted_class: int,
    model,
    feature_names: list[str],
) -> dict[str, float]:
    """
    Compute per-feature contributions for the predicted class.

    contribution_i = coefficient_i × scaled_feature_value_i

    Parameters
    ----------
    scaled_sample : np.ndarray, shape (n_features,)
        Single sample AFTER scaling.
    predicted_class : int
        The predicted risk class (0–3).
    model : LogisticRegression
        Fitted model with .coef_ attribute.
    feature_names : list[str]

    Returns
    -------
    dict[str, float]
        Feature name → contribution, sorted by |contribution| descending.
        Positive values indicate increased likelihood of the predicted class,
        negative indicate decreased likelihood.
    """
    coefficients = model.coef_[predicted_class]  # shape: (n_features,)
    contributions = coefficients * scaled_sample

    # Build sorted dict (descending by absolute contribution)
    pairs = sorted(
        zip(feature_names, contributions),
        key=lambda pair: abs(pair[1]),
        reverse=True,
    )

    return {name: round(float(val), 6) for name, val in pairs}


def get_top_features(
    contributions: dict[str, float],
    top_n: int = 5,
) -> dict[str, float]:
    """
    Return the top-N features by absolute contribution.

    Parameters
    ----------
    contributions : dict[str, float]
        Full contribution dict (already sorted).
    top_n : int
        Number of features to return (3–5 recommended).

    Returns
    -------
    dict[str, float]
    """
    return dict(list(contributions.items())[:top_n])


# ──────────────────────────────────────────────
# HUMAN-READABLE EXPLANATION
# ──────────────────────────────────────────────
def generate_explanation(
    top_contributions: dict[str, float],
) -> str:
    """
    Convert top feature contributions into a concise, medically meaningful sentence.

    Rules:
        - Positive contribution → increases the likelihood of this risk level
        - Negative contribution → reduces the likelihood of this risk level

    Parameters
    ----------
    top_contributions : dict[str, float]
        Top-N feature contributions (name → value).

    Returns
    -------
    str : human-readable explanation.
    """
    likelihood_increasing: list[str] = []
    likelihood_decreasing: list[str] = []

    for feature, value in top_contributions.items():
        display_name = FEATURE_DISPLAY_NAMES.get(feature, feature)
        if value > 0:
            likelihood_increasing.append(display_name)
        elif value < 0:
            likelihood_decreasing.append(display_name)
        # value == 0 → no effect, skip

    parts: list[str] = []

    if likelihood_increasing:
        joined = _join_list(likelihood_increasing)
        verb = "increase" if len(likelihood_increasing) > 1 else "increases"
        parts.append(f"{joined} {verb} the likelihood of this risk level")

    if likelihood_decreasing:
        joined = _join_list(likelihood_decreasing)
        verb = "reduce" if len(likelihood_decreasing) > 1 else "reduces"
        target = "it" if parts else "the likelihood of this risk level"
        parts.append(f"{joined} {verb} {target}")

    if not parts:
        return "No dominant contributing features identified for this prediction."

    # Capitalize first letter, join with ", while "
    explanation = ", while ".join(parts) + "."
    return explanation[0].upper() + explanation[1:]


def _join_list(items: list[str]) -> str:
    """Join a list of items with commas and 'and'."""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


# ──────────────────────────────────────────────
# GLOBAL FEATURE IMPORTANCE
# ──────────────────────────────────────────────
def get_global_importance(
    artifacts: dict[str, Any],
    save: bool = True,
    save_path: Path = GLOBAL_IMPORTANCE_PATH,
) -> list[dict[str, Any]]:
    """
    Compute global feature importance from Logistic Regression coefficients.

    importance_i = mean(|coef_i|) across all classes

    Parameters
    ----------
    artifacts : dict
        Output of load_artifacts().
    save : bool
        Whether to save the result to CSV.
    save_path : Path
        Destination for the CSV file.

    Returns
    -------
    pd.DataFrame with columns: feature, importance (sorted descending).
    """
    model = artifacts["model"]
    feature_names = artifacts["feature_names"]

    # coef_ shape: (n_classes, n_features)
    importance = np.mean(np.abs(model.coef_), axis=0)

    df = pd.DataFrame({
        "feature": feature_names,
        "importance": np.round(importance, 6),
    })
    df = df.sort_values("importance", ascending=False).reset_index(drop=True)

    if save:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(save_path, index=False)
        print(f"  Global feature importance saved to: {save_path}")

    return df.to_dict(orient="records")


# ──────────────────────────────────────────────
# PREDICTION WRAPPER (API-READY)
# ──────────────────────────────────────────────
def predict_risk(
    raw_features: np.ndarray | list[float] | pd.DataFrame | dict[str, float],
    artifacts: dict[str, Any],
    top_n: int = 5,
) -> dict[str, Any]:
    """
    Full prediction + explanation pipeline for a single patient.

    Parameters
    ----------
    raw_features : array-like, shape (n_features,)
        Raw (unscaled) feature values in the same order as feature_names.
    artifacts : dict
        Output of load_artifacts().
    top_n : int
        Number of top contributing features to include.

    Returns
    -------
    dict with keys:
        - risk : int (0–3)
        - risk_label : str ("Low" / "Mild" / "Moderate" / "High")
        - probabilities : list[float]
        - feature_contributions : dict[str, float]
        - explanation : str
    """
    model = artifacts["model"]
    feature_names = artifacts["feature_names"]
    scaler = artifacts["scaler"]

    # ── Validate & reshape input ────────────────
    if isinstance(raw_features, pd.DataFrame):
        missing = set(feature_names) - set(raw_features.columns)
        if missing:
            raise ValueError(f"Missing features in input: {missing}")
        raw = raw_features[feature_names].to_numpy().reshape(1, -1)
    elif isinstance(raw_features, dict):
        missing = set(feature_names) - set(raw_features.keys())
        if missing:
            raise ValueError(f"Missing features in input: {missing}")
        raw = np.array([[raw_features[f] for f in feature_names]], dtype=float)
    else:
        raw = np.asarray(raw_features, dtype=float).reshape(1, -1)

    if raw.shape[1] != len(feature_names):
        raise ValueError(
            f"Expected {len(feature_names)} features, got {raw.shape[1]}. "
            f"Required order: {feature_names}"
        )

    # ── Handle missing values (NaN → 0.0) ──────
    if np.isnan(raw).any():
        nan_count = int(np.isnan(raw).sum())
        raw = np.nan_to_num(raw, nan=0.0)
        print(f"  Warning: {nan_count} missing value(s) replaced with 0.0")

    # ── Scale ───────────────────────────────────
    scaled = _scale_input(raw, feature_names, scaler)
    scaled_sample = scaled[0]  # shape: (n_features,)

    # ── Predict ─────────────────────────────────
    predicted_class = int(model.predict(scaled)[0])
    raw_probabilities = model.predict_proba(scaled)[0].tolist()
    
    if not np.isclose(sum(raw_probabilities), 1.0, atol=1e-6):
        raise ValueError("Probabilities do not sum to 1.0")
        
    probabilities = [round(p, 6) for p in raw_probabilities]

    # ── Contributions ───────────────────────────
    contributions = compute_contributions(
        scaled_sample, predicted_class, model, feature_names,
    )
    top_features = get_top_features(contributions, top_n=top_n)

    # ── Explanation ─────────────────────────────
    explanation = generate_explanation(top_features)

    return {
        "risk": predicted_class,
        "risk_label": RISK_LABELS[predicted_class],
        "probabilities": probabilities,
        "feature_contributions": top_features,
        "explanation": explanation,
    }


# ──────────────────────────────────────────────
# BATCH PREDICTION
# ──────────────────────────────────────────────
def predict_risk_batch(
    raw_features_batch: np.ndarray | list[list[float]] | pd.DataFrame,
    artifacts: dict[str, Any],
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """
    Run predict_risk for multiple patients.

    Parameters
    ----------
    raw_features_batch : array-like, shape (n_samples, n_features)
    artifacts : dict
    top_n : int

    Returns
    -------
    list[dict] : one result dict per patient.
    """
    if isinstance(raw_features_batch, pd.DataFrame):
        missing = set(artifacts["feature_names"]) - set(raw_features_batch.columns)
        if missing:
            raise ValueError(f"Missing features in batch: {missing}")
        batch = raw_features_batch[artifacts["feature_names"]].to_numpy()
    else:
        batch = np.asarray(raw_features_batch, dtype=float)
        if batch.ndim == 1:
            batch = batch.reshape(1, -1)

    return [
        predict_risk(batch[i], artifacts, top_n=top_n)
        for i in range(batch.shape[0])
    ]


# ──────────────────────────────────────────────
# MAIN (standalone demo)
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import json

    print("=" * 60)
    print("  EXPLAINABILITY MODULE - DEMO")
    print("=" * 60)
    print()

    # Step 1: Load artifacts
    print("-- Step 1: Load Artifacts")
    artifacts = load_artifacts()
    feature_names = artifacts["feature_names"]
    print(f"  Model type: {type(artifacts['model']).__name__}")
    print(f"  Features ({len(feature_names)}): {feature_names}")
    print()

    # Step 2: Demo prediction with a synthetic patient
    print("-- Step 2: Single Patient Prediction")
    # Example: 65-year-old, PSA=12, BMI=28, 6h sleep, psa_density=0.43,
    #          family_history=1, smoking=0, activity_level=1,
    #          region=2, diet=1, pollution=2, alcohol=1
    demo_patient = [65, 12, 28, 6, 0.43, 1, 0, 1, 2, 1, 2, 1]
    result = predict_risk(demo_patient, artifacts, top_n=5)

    print(f"  Input features: {demo_patient}")
    print()
    print(f"  Risk class : {result['risk']} ({result['risk_label']})")
    print(f"  Probabilities: {result['probabilities']}")
    print(f"  Top features :")
    for feat, val in result["feature_contributions"].items():
        direction = "(+) increases likelihood" if val > 0 else "(-) decreases likelihood"
        print(f"    {feat:20s} -> {val:+.6f}  {direction}")
    print()
    print(f"  Explanation: {result['explanation']}")
    print()

    # Step 3: Global importance
    print("-- Step 3: Global Feature Importance")
    global_df = get_global_importance(artifacts)
    print()
    print(pd.DataFrame(global_df).to_string(index=False))
    print()

    # Step 4: Full JSON output (API-ready)
    print("-- Step 4: JSON Output (API-ready)")
    print(json.dumps(result, indent=2))

    print()
    print("=" * 60)
    print("  EXPLAINABILITY DEMO COMPLETE")
    print("=" * 60)
