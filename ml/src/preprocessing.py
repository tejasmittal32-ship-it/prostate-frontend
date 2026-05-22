"""
Data Preprocessing Module for Prostate Cancer Risk Stratification
=================================================================
Loads the synthetic dataset, engineers features, scales numerics,
and produces train/test splits ready for model training.

Usage:
    from src.preprocessing import load_data, preprocess_data, split_data

    df = load_data()
    X, y, feature_names = preprocess_data(df)
    X_train, X_test, y_train, y_test = split_data(X, y)
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "generated" / "prostate_cancer_data.csv"
SCALER_PATH = PROJECT_ROOT / "models" / "scaler.joblib"

TARGET = "risk"

NUMERIC_FEATURES = ["age", "psa", "bmi", "sleep_hours", "psa_density"]

CATEGORICAL_FEATURES = [
    "family_history", "smoking", "activity_level",
    "region", "diet", "pollution", "alcohol",
]

RANDOM_STATE = 42
TEST_SIZE = 0.2


# ──────────────────────────────────────────────
# LOAD DATA
# ──────────────────────────────────────────────
def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """
    Load the generated CSV dataset.

    Parameters
    ----------
    path : Path
        Absolute or relative path to the CSV file.

    Returns
    -------
    pd.DataFrame

    Raises
    ------
    FileNotFoundError
        If the dataset CSV does not exist at the expected path.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}. "
            "Run data_generation.py first to create it."
        )

    df = pd.read_csv(path)

    print(f"  Loaded dataset: {path.name}")
    print(f"  Shape: {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"  Columns: {list(df.columns)}")
    print()

    return df


# ──────────────────────────────────────────────
# PREPROCESS DATA
# ──────────────────────────────────────────────
def preprocess_data(
    df: pd.DataFrame,
    scaler_path: Path = SCALER_PATH,
    fit_scaler: bool = True,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """
    Engineer features, handle missing values, scale numerics.

    Parameters
    ----------
    df : pd.DataFrame
        Raw dataset with all original columns + target.
    scaler_path : Path
        Where to save (or load) the fitted StandardScaler.
    fit_scaler : bool
        If True, fit a new scaler and save it.
        If False, load an existing scaler from scaler_path (for inference).

    Returns
    -------
    X : np.ndarray
        Feature matrix (numeric scaled + categorical as-is).
    y : np.ndarray
        Target array (risk: 0-3).
    feature_names : list[str]
        Ordered list of feature column names matching X columns.
    """
    df = df.copy()

    # ── Feature Engineering ──────────────────
    # psa_density = psa / bmi  (safe division)
    df["psa_density"] = df["psa"] / df["bmi"].replace(0, np.nan)
    df["psa_density"] = df["psa_density"].fillna(0.0)
    df["psa_density"] = df["psa_density"].round(4)

    # ── Missing Value Handling ───────────────
    # Numeric: fill with median
    all_numeric = NUMERIC_FEATURES + [TARGET]
    for col in all_numeric:
        if col in df.columns and df[col].isna().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            print(f"  Filled {df[col].isna().sum()} missing values in '{col}' with median={median_val:.2f}")

    # Categorical: fill with mode
    for col in CATEGORICAL_FEATURES:
        if col in df.columns and df[col].isna().any():
            mode_val = df[col].mode()[0]
            df[col] = df[col].fillna(mode_val)
            print(f"  Filled missing values in '{col}' with mode={mode_val}")

    remaining_nulls = df.isna().sum().sum()
    print(f"  Missing values after handling: {remaining_nulls}")

    # ── Separate target ──────────────────────
    y = df[TARGET].values

    # ── Scale numeric features ───────────────
    numeric_df = df[NUMERIC_FEATURES].copy()
    categorical_df = df[CATEGORICAL_FEATURES].copy()

    if fit_scaler:
        scaler = StandardScaler()
        numeric_scaled = scaler.fit_transform(numeric_df)

        # Save scaler artifact
        scaler_path = Path(scaler_path)
        scaler_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(scaler, scaler_path)
        print(f"  Scaler saved to: {scaler_path}")
    else:
        if not Path(scaler_path).exists():
            raise FileNotFoundError(
                f"Scaler not found at {scaler_path}. "
                "Run preprocessing with fit_scaler=True first."
            )
        scaler = joblib.load(scaler_path)
        numeric_scaled = scaler.transform(numeric_df)
        print(f"  Scaler loaded from: {scaler_path}")

    # ── Combine scaled numerics + raw categoricals ──
    feature_names = NUMERIC_FEATURES + CATEGORICAL_FEATURES

    numeric_scaled_df = pd.DataFrame(
        numeric_scaled,
        columns=NUMERIC_FEATURES,
        index=df.index,
    )

    X = pd.concat([numeric_scaled_df, categorical_df], axis=1)
    X = X[feature_names].values  # Enforce column order

    print(f"  Feature matrix shape: {X.shape}")
    print(f"  Features: {feature_names}")
    print()

    return X, y, feature_names


# ──────────────────────────────────────────────
# SPLIT DATA
# ──────────────────────────────────────────────
def split_data(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Stratified train-test split.

    Parameters
    ----------
    X : np.ndarray
        Feature matrix.
    y : np.ndarray
        Target array.
    test_size : float
        Fraction of data reserved for testing.
    random_state : int
        Reproducibility seed.

    Returns
    -------
    X_train, X_test, y_train, y_test : np.ndarray
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )

    print(f"  Train set: {X_train.shape[0]:,} samples")
    print(f"  Test  set: {X_test.shape[0]:,} samples")
    print()

    # Class distribution
    _print_class_distribution("Train", y_train)
    _print_class_distribution("Test ", y_test)

    return X_train, X_test, y_train, y_test


def _print_class_distribution(label: str, y: np.ndarray) -> None:
    """Print class counts and percentages."""
    labels = {0: "Low", 1: "Mild", 2: "Moderate", 3: "High"}
    unique, counts = np.unique(y, return_counts=True)
    total = len(y)
    parts = []
    for cls, cnt in zip(unique, counts):
        pct = 100 * cnt / total
        parts.append(f"{labels.get(cls, cls)}={cnt}({pct:.1f}%)")
    print(f"  {label} distribution: {', '.join(parts)}")


# ──────────────────────────────────────────────
# MAIN (standalone validation)
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  PREPROCESSING PIPELINE")
    print("=" * 60)
    print()

    # Step 1: Load
    print("-- Step 1: Load Data")
    df = load_data()

    # Step 2: Preprocess
    print("-- Step 2: Preprocess (engineer + scale)")
    X, y, feature_names = preprocess_data(df)

    # Step 3: Split
    print("-- Step 3: Train-Test Split")
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Summary
    print("=" * 60)
    print("  PREPROCESSING COMPLETE")
    print("=" * 60)
    print(f"  X_train: {X_train.shape}")
    print(f"  X_test:  {X_test.shape}")
    print(f"  y_train: {y_train.shape}")
    print(f"  y_test:  {y_test.shape}")
    print(f"  Features ({len(feature_names)}): {feature_names}")
    print()
