"""
Model Training Module for Prostate Cancer Risk Stratification
=============================================================
Trains, tunes, and compares Random Forest, Logistic Regression,
and XGBoost for multi-class risk prediction (0-3). Selects the
best model by macro F1-score and saves artifacts.

Usage:
    from src.preprocessing import load_data, preprocess_data, split_data
    from src.train import run_training_pipeline

    df = load_data()
    X, y, feature_names = preprocess_data(df)
    X_train, X_test, y_train, y_test = split_data(X, y)
    best_model, results = run_training_pipeline(X_train, X_test, y_train, y_test)
"""

import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    RandomizedSearchCV,
    StratifiedKFold,
)
from xgboost import XGBClassifier

warnings.filterwarnings("ignore", category=UserWarning)

# ──────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
BEST_MODEL_PATH = MODELS_DIR / "best_model.joblib"
BUNDLE_PATH = MODELS_DIR / "model_bundle.joblib"
COMPARISON_PATH = MODELS_DIR / "model_comparison.csv"
IMPORTANCE_PATH = MODELS_DIR / "feature_importance.csv"

RANDOM_STATE = 42
CV_SPLITS = 5
N_ITER_SEARCH = 20  # RandomizedSearchCV iterations

# ──────────────────────────────────────────────
# HYPERPARAMETER SEARCH SPACES
# ──────────────────────────────────────────────
PARAM_GRIDS = {
    "RandomForest": {
        "n_estimators": [100, 200, 300, 500],
        "max_depth": [5, 10, 15, 20, None],
        "min_samples_split": [2, 5, 10],
        "class_weight": ["balanced"],
    },
    "LogisticRegression": {
        "C": [0.01, 0.1, 1, 10, 100],
        "solver": ["lbfgs"],
        "max_iter": [1000],
    },
    "XGBoost": {
        "n_estimators": [100, 200, 300],
        "max_depth": [3, 5, 7, 10],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "subsample": [0.7, 0.8, 1.0],
    },
}


def _get_base_estimators() -> dict:
    """Return untuned base estimators for each model type."""
    return {
        "RandomForest": RandomForestClassifier(
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "LogisticRegression": LogisticRegression(
            random_state=RANDOM_STATE,
            max_iter=1000,
        ),
        "XGBoost": XGBClassifier(
            objective="multi:softprob",
            eval_metric="mlogloss",
            use_label_encoder=False,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbosity=0,
        ),
    }


# ──────────────────────────────────────────────
# TUNING
# ──────────────────────────────────────────────
def tune_model(
    name: str,
    estimator,
    param_grid: dict,
    X_train: np.ndarray,
    y_train: np.ndarray,
    cv: StratifiedKFold,
) -> RandomizedSearchCV:
    """
    Run RandomizedSearchCV for a single model.

    Parameters
    ----------
    name : str
        Model display name.
    estimator : sklearn estimator
        Base estimator to tune.
    param_grid : dict
        Hyperparameter search space.
    X_train, y_train : np.ndarray
        Training data.
    cv : StratifiedKFold
        Cross-validation strategy.

    Returns
    -------
    RandomizedSearchCV
        Fitted search object with best estimator accessible via .best_estimator_.
    """
    # Determine number of combinations to cap n_iter
    from itertools import product
    total_combos = 1
    for values in param_grid.values():
        total_combos *= len(values)
    n_iter = min(N_ITER_SEARCH, total_combos)

    print(f"    Tuning {name} ({n_iter} iterations, {CV_SPLITS}-fold CV)...")

    search = RandomizedSearchCV(
        estimator=estimator,
        param_distributions=param_grid,
        n_iter=n_iter,
        cv=cv,
        scoring="f1_macro",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=0,
        refit=True,
    )
    search.fit(X_train, y_train)

    print(f"    Best CV F1 (macro): {search.best_score_:.4f}")
    print(f"    Best params: {search.best_params_}")

    return search


def _tune_xgboost_with_early_stopping(
    param_grid: dict,
    X_train: np.ndarray,
    y_train: np.ndarray,
    cv: StratifiedKFold,
) -> XGBClassifier:
    """
    Tune XGBoost with early stopping on a held-out validation split,
    then refit with cross-validated best params on all training data.

    Returns
    -------
    XGBClassifier
        Best tuned and refitted model.
    """
    from sklearn.model_selection import train_test_split

    # Hold out 15% of training data for early stopping
    X_fit, X_val, y_fit, y_val = train_test_split(
        X_train, y_train,
        test_size=0.15,
        stratify=y_train,
        random_state=RANDOM_STATE,
    )

    print(f"    Tuning XGBoost ({N_ITER_SEARCH} iterations, {CV_SPLITS}-fold CV)...")
    print(f"    Early stopping validation set: {X_val.shape[0]} samples")

    # Step 1: Find best hyperparams via RandomizedSearchCV (without early stopping for CV)
    base_xgb = XGBClassifier(
        objective="multi:softprob",
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )

    total_combos = 1
    for values in param_grid.values():
        total_combos *= len(values)
    n_iter = min(N_ITER_SEARCH, total_combos)

    search = RandomizedSearchCV(
        estimator=base_xgb,
        param_distributions=param_grid,
        n_iter=n_iter,
        cv=cv,
        scoring="f1_macro",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=0,
        refit=False,  # We'll refit manually with early stopping
    )
    search.fit(X_train, y_train)

    best_params = search.best_params_
    print(f"    Best CV F1 (macro): {search.best_score_:.4f}")
    print(f"    Best params: {best_params}")

    # Step 2: Refit best model with early stopping on full training data
    final_xgb = XGBClassifier(
        **best_params,
        objective="multi:softprob",
        eval_metric="mlogloss",
        use_label_encoder=False,
        early_stopping_rounds=30,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    final_xgb.fit(
        X_fit, y_fit,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    actual_rounds = final_xgb.best_iteration + 1
    print(f"    Early stopping: best iteration = {actual_rounds}")

    # Step 3: Refit on ALL training data with the discovered n_estimators
    final_model = XGBClassifier(
        **{k: v for k, v in best_params.items() if k != "n_estimators"},
        n_estimators=actual_rounds,
        objective="multi:softprob",
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    final_model.fit(X_train, y_train)

    return final_model


# ──────────────────────────────────────────────
# EVALUATION
# ──────────────────────────────────────────────
RISK_LABELS = {0: "Low", 1: "Mild", 2: "Moderate", 3: "High"}


def evaluate_model(
    name: str,
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> dict:
    """
    Evaluate a trained model on the test set.

    Returns
    -------
    dict with keys: model_name, accuracy, f1_macro, roc_auc
    """
    y_pred = model.predict(X_test)

    # Probabilities for ROC-AUC
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
    else:
        y_prob = None

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")

    # Multi-class ROC-AUC (One-vs-Rest)
    if y_prob is not None:
        try:
            auc = roc_auc_score(
                y_test, y_prob,
                multi_class="ovr",
                average="macro",
            )
        except ValueError:
            # Fallback if a class is missing from predictions
            auc = float("nan")
    else:
        auc = float("nan")

    return {
        "model_name": name,
        "accuracy": round(acc, 4),
        "f1_macro": round(f1, 4),
        "roc_auc": round(auc, 4),
    }


def print_classification_report(
    name: str,
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> None:
    """
    Print a detailed sklearn classification report with class-3 highlight.
    """
    y_pred = model.predict(X_test)
    target_names = [f"{RISK_LABELS[i]} (risk={i})" for i in sorted(RISK_LABELS)]

    report = classification_report(
        y_test, y_pred,
        target_names=target_names,
        digits=4,
        zero_division=0,
    )

    print(f"    Classification Report ({name}):")
    print()
    for line in report.split("\n"):
        print(f"      {line}")

    # Highlight class 3 (High risk) performance
    report_dict = classification_report(
        y_test, y_pred,
        target_names=target_names,
        output_dict=True,
        zero_division=0,
    )
    high_key = f"{RISK_LABELS[3]} (risk=3)"
    if high_key in report_dict:
        h = report_dict[high_key]
        print(f"    >> Class 3 (High Risk): "
              f"Precision={h['precision']:.4f}  "
              f"Recall={h['recall']:.4f}  "
              f"F1={h['f1-score']:.4f}  "
              f"Support={int(h['support'])}")
    print()


# ──────────────────────────────────────────────
# FEATURE IMPORTANCE
# ──────────────────────────────────────────────
def extract_feature_importance(
    trained_models: dict,
    feature_names: list[str],
) -> pd.DataFrame:
    """
    Extract feature importance from all trained models.

    - LogisticRegression: mean |coef_| across classes
    - RandomForest / XGBoost: .feature_importances_

    Returns
    -------
    pd.DataFrame with columns: feature, <model_name>_importance, ...
    """
    importance_df = pd.DataFrame({"feature": feature_names})

    for name, model in trained_models.items():
        if name == "LogisticRegression" and hasattr(model, "coef_"):
            # coef_ shape: (n_classes, n_features) -> mean absolute across classes
            imp = np.mean(np.abs(model.coef_), axis=0)
        elif hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
        else:
            imp = np.zeros(len(feature_names))

        importance_df[f"{name}_importance"] = np.round(imp, 6)

    # Add a mean importance column across all models (for ranking)
    imp_cols = [c for c in importance_df.columns if c.endswith("_importance")]
    importance_df["mean_importance"] = importance_df[imp_cols].mean(axis=1).round(6)
    importance_df = importance_df.sort_values("mean_importance", ascending=False)
    importance_df = importance_df.reset_index(drop=True)

    return importance_df


def print_feature_importance(importance_df: pd.DataFrame, top_n: int = 10) -> None:
    """Print the top-N most important features."""
    print("-" * 60)
    print(f"  TOP {top_n} FEATURES (by mean importance across models)")
    print("-" * 60)
    print()
    print(importance_df.head(top_n).to_string(index=False))
    print()


# ──────────────────────────────────────────────
# MODEL BUNDLE
# ──────────────────────────────────────────────
def save_model_bundle(
    model,
    feature_names: list[str],
    bundle_path: Path = BUNDLE_PATH,
) -> Path:
    """
    Save a model bundle (model + feature_names) for API deployment.

    Returns
    -------
    Path to saved bundle.
    """
    bundle = {
        "model": model,
        "feature_names": feature_names,
    }
    bundle_path = Path(bundle_path)
    bundle_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, bundle_path)
    return bundle_path


# ──────────────────────────────────────────────
# COMPARISON & SELECTION
# ──────────────────────────────────────────────
def compare_models(results: list[dict]) -> pd.DataFrame:
    """
    Build a comparison table sorted by F1 (macro) descending.

    Returns
    -------
    pd.DataFrame with columns: model_name, accuracy, f1_macro, roc_auc
    """
    df = pd.DataFrame(results)
    df = df.sort_values("f1_macro", ascending=False).reset_index(drop=True)
    return df


def select_best(results: list[dict]) -> str:
    """
    Select best model name by primary=f1_macro, secondary=roc_auc.

    Returns
    -------
    str : name of the best model
    """
    df = pd.DataFrame(results)
    df = df.sort_values(
        ["f1_macro", "roc_auc"],
        ascending=[False, False],
    ).reset_index(drop=True)
    return df.iloc[0]["model_name"]


# ──────────────────────────────────────────────
# FULL PIPELINE
# ──────────────────────────────────────────────
def run_training_pipeline(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: list[str] | None = None,
) -> tuple:
    """
    Run the full training pipeline: tune all models, evaluate, compare, save best.

    Parameters
    ----------
    X_train, X_test, y_train, y_test : np.ndarray
        Preprocessed data splits.
    feature_names : list[str] | None
        Feature column names (needed for importance & bundle).

    Returns
    -------
    best_model : fitted estimator
    comparison_df : pd.DataFrame with evaluation metrics
    trained_models : dict[str, estimator] all fitted models
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    cv = StratifiedKFold(
        n_splits=CV_SPLITS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    base_estimators = _get_base_estimators()
    trained_models = {}
    results = []

    print("-" * 60)
    print("  MODEL TRAINING & TUNING")
    print("-" * 60)
    print()

    for name in ["RandomForest", "LogisticRegression", "XGBoost"]:
        print(f"  [{name}]")

        if name == "XGBoost":
            # Special path: early stopping
            model = _tune_xgboost_with_early_stopping(
                PARAM_GRIDS[name], X_train, y_train, cv,
            )
        else:
            search = tune_model(
                name, base_estimators[name],
                PARAM_GRIDS[name], X_train, y_train, cv,
            )
            model = search.best_estimator_

        trained_models[name] = model

        # Save individual model
        model_path = MODELS_DIR / f"{name}_best.joblib"
        joblib.dump(model, model_path)
        print(f"    Saved: {model_path.name}")

        # Evaluate on test set
        metrics = evaluate_model(name, model, X_test, y_test)
        results.append(metrics)

        print(f"    Test Accuracy: {metrics['accuracy']:.4f}")
        print(f"    Test F1 (macro): {metrics['f1_macro']:.4f}")
        print(f"    Test ROC-AUC: {metrics['roc_auc']:.4f}")
        print()

        # Detailed classification report
        print_classification_report(name, model, X_test, y_test)

    # ── Comparison table ─────────────────────
    comparison_df = compare_models(results)
    comparison_df.to_csv(COMPARISON_PATH, index=False)

    print("-" * 60)
    print("  MODEL COMPARISON (sorted by F1 macro)")
    print("-" * 60)
    print()
    print(comparison_df.to_string(index=False))
    print()
    print(f"  Comparison saved to: {COMPARISON_PATH.name}")
    print()

    # ── Feature importance ───────────────────
    if feature_names is not None:
        importance_df = extract_feature_importance(trained_models, feature_names)
        importance_df.to_csv(IMPORTANCE_PATH, index=False)
        print_feature_importance(importance_df)
        print(f"  Feature importance saved to: {IMPORTANCE_PATH.name}")
        print()

    # ── Select & save best ───────────────────
    best_name = select_best(results)
    best_model = trained_models[best_name]
    joblib.dump(best_model, BEST_MODEL_PATH)

    print("-" * 60)
    print(f"  BEST MODEL: {best_name}")
    print(f"  Saved to: {BEST_MODEL_PATH.name}")
    print("-" * 60)
    print()

    # ── Model bundle for API ─────────────────
    if feature_names is not None:
        bundle_path = save_model_bundle(best_model, feature_names)
        print(f"  Model bundle saved to: {bundle_path.name}")
        print(f"  Bundle contents: model + feature_names ({len(feature_names)} features)")
        print()

    return best_model, comparison_df, trained_models


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(PROJECT_ROOT))

    from src.preprocessing import load_data, preprocess_data, split_data

    print("=" * 60)
    print("  TRAINING PIPELINE")
    print("=" * 60)
    print()

    # Step 1: Load & preprocess
    print("-- Step 1: Load & Preprocess")
    df = load_data()
    X, y, feature_names = preprocess_data(df)
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Step 2: Train
    print("-- Step 2: Train, Tune & Compare")
    print()
    best_model, comparison_df, trained_models = run_training_pipeline(
        X_train, X_test, y_train, y_test,
        feature_names=feature_names,
    )

    print("=" * 60)
    print("  TRAINING COMPLETE")
    print("=" * 60)
