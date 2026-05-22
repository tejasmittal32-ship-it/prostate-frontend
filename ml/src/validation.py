"""
Validation Module for Prostate Cancer Risk Stratification
=========================================================
Performs stability, reliability, and robustness checks on the trained ML models.
Outputs validation plots to the plots/ directory.
"""

from __future__ import annotations

import warnings
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import auc, roc_curve
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import label_binarize

from src.preprocessing import load_data, preprocess_data, split_data, NUMERIC_FEATURES

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
PLOTS_DIR = PROJECT_ROOT / "plots"

def run_cross_validation(models: dict, X: np.ndarray, y: np.ndarray) -> dict:
    """Run 5-fold cross validation for all models."""
    print("-- 1. Cross-Validation (Model Stability)")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {'acc': 'accuracy', 'f1_macro': 'f1_macro'}
    results = {}
    
    for name, model in models.items():
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            scores = cross_validate(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
            
        acc_mean = np.mean(scores['test_acc'])
        acc_std = np.std(scores['test_acc'])
        f1_mean = np.mean(scores['test_f1_macro'])
        
        results[name] = {"Accuracy": f"{acc_mean:.4f} ± {acc_std:.4f}", "F1": f"{f1_mean:.4f}"}
        print(f"  {name}: Accuracy={acc_mean:.4f}±{acc_std:.4f}, F1-Macro={f1_mean:.4f}")
    
    print()
    return results

def check_calibration(best_model, X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray):
    """Generate and plot calibration curve for the best model."""
    print("-- 2. Calibration Check")
    calibrated_model = CalibratedClassifierCV(best_model, cv=5, method='sigmoid')
    
    # Fit the CalibratedClassifierCV on training data to avoid data leakage.
    calibrated_model.fit(X_train, y_train)
    
    plt.figure(figsize=(8, 6))
    
    # Calibration curve is shown for class 3 (high-risk class) - this is intentional due to clinical importance.
    y_test_bin = (y_test == 3).astype(int)
    
    # Original model prediction
    prob_uncalib = best_model.predict_proba(X_test)[:, 3]
    prob_true_un, prob_pred_un = calibration_curve(y_test_bin, prob_uncalib, n_bins=10)
    plt.plot(prob_pred_un, prob_true_un, 'o-', label='Uncalibrated (Class 3)')
    
    # Calibrated model prediction
    prob_calib = calibrated_model.predict_proba(X_test)[:, 3]
    prob_true_cal, prob_pred_cal = calibration_curve(y_test_bin, prob_calib, n_bins=10)
    plt.plot(prob_pred_cal, prob_true_cal, 's-', label='Calibrated (Class 3)')
    
    plt.plot([0, 1], [0, 1], 'k--', label='Perfectly Calibrated')
    
    plt.xlabel('Mean Predicted Probability')
    plt.ylabel('Fraction of Positives')
    plt.title('Calibration Curve / Reliability Diagram')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "calibration_curve.png")
    plt.close()
    
    print("  Saved plots/calibration_curve.png\n")
    return calibrated_model

def plot_roc_per_class(best_model, X_test: np.ndarray, y_test: np.ndarray):
    """Plot One-vs-Rest ROC curve for each class."""
    print("-- 3. ROC Curves per class")
    y_test_bin = label_binarize(y_test, classes=[0, 1, 2, 3])
    n_classes = y_test_bin.shape[1]
    y_score = best_model.predict_proba(X_test)
    
    plt.figure(figsize=(8, 6))
    for i in range(n_classes):
        fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_score[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, lw=2, label=f'Class {i} (AUC = {roc_auc:.2f})')
        
    plt.plot([0, 1], [0, 1], 'k--', lw=2)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('One-vs-Rest ROC Curves for Best Model')
    plt.legend(loc="lower right")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "roc_per_class.png")
    plt.close()
    print("  Saved plots/roc_per_class.png\n")

def run_sensitivity_analysis(best_model, df: pd.DataFrame, feature_names: list[str]):
    """Perform a grid-based sensitivity analysis on PSA and age."""
    print("-- 4. Sensitivity Analysis")
    
    temp_df = df.copy()
    temp_df['psa_density'] = temp_df['psa'] / temp_df['bmi'].replace(0, np.nan)
    temp_df['psa_density'] = temp_df['psa_density'].fillna(0.0)
    
    median_vals = temp_df[feature_names].median()
    psa_range = np.linspace(1, 25, 50)
    age_range = np.linspace(40, 85, 50)
    PSA_grid, AGE_grid = np.meshgrid(psa_range, age_range)
    
    psa_flat = PSA_grid.flatten()
    age_flat = AGE_grid.flatten()
    
    # Build dataframe for analysis
    test_df = pd.DataFrame([median_vals] * len(psa_flat), columns=feature_names)
    test_df['psa'] = psa_flat
    test_df['age'] = age_flat
    
    # Recalculate derivative feature
    test_df['psa_density'] = test_df['psa'] / test_df['bmi'].replace(0, np.nan)
    test_df.fillna({'psa_density': 0.0}, inplace=True)
    
    # Load and explicitly use the scaler
    scaler = joblib.load(MODELS_DIR / "scaler.joblib")
    numeric_scaled = scaler.transform(test_df[NUMERIC_FEATURES])
    
    X_sens = test_df.copy()
    X_sens[NUMERIC_FEATURES] = numeric_scaled
    X_arr = X_sens[feature_names].values
    
    preds_flat = best_model.predict(X_arr)
    preds_grid = preds_flat.reshape(PSA_grid.shape)
    
    plt.figure(figsize=(9, 7))
    contour = plt.contourf(
        PSA_grid, AGE_grid, preds_grid, 
        levels=[-0.5, 0.5, 1.5, 2.5, 3.5], 
        colors=['#a6bddb', '#74a9cf', '#2b8cbe', '#045a8d']
    )
    plt.colorbar(contour, ticks=[0, 1, 2, 3], label='Predicted Risk Class')
    plt.xlabel('PSA Level')
    plt.ylabel('Age')
    plt.title('Sensitivity Analysis: Predicted Risk by PSA and Age')
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "sensitivity_heatmap.png")
    plt.close()
    
    print("  Saved plots/sensitivity_heatmap.png\n")

def check_data_leakage(df: pd.DataFrame, feature_names: list[str]) -> bool:
    """Check if any feature is perfectly or near-perfectly correlated with the target."""
    print("-- 5. Data Leakage Check")
    leakage_found = False
    
    # Compute derivative features so they exist in df to correlate
    temp_df = df.copy()
    temp_df['psa_density'] = temp_df['psa'] / temp_df['bmi'].replace(0, np.nan)
    temp_df['psa_density'] = temp_df['psa_density'].fillna(0.0)
    
    for feature in feature_names:
        corr = temp_df[feature].corr(temp_df['risk'])
        if abs(corr) > 0.95:
            print(f"  [WARNING] High correlation found for {feature}: {corr:.4f}")
            leakage_found = True
            
    if not leakage_found:
        print("  Status: OK. No data leakage detected (all features < 0.95 correlation)")
    print()
    return leakage_found

def main():
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load the original data & create feature sets naturally
    df = load_data()
    X, y, feature_names = preprocess_data(df, fit_scaler=False)
    X_train, X_test, y_train, y_test = split_data(X, y)
    
    # Load all models dynamically
    models = {}
    for name in ["LogisticRegression", "RandomForest", "XGBoost"]:
        path = MODELS_DIR / f"{name}_best.joblib"
        if path.exists():
            models[name] = joblib.load(path)
            
    # Load best model bundle
    bundle_path = MODELS_DIR / "model_bundle.joblib"
    if bundle_path.exists():
        best_model = joblib.load(bundle_path)["model"]
    else:
        raise FileNotFoundError("model_bundle.joblib not found. Run train.py first.")

    print("=" * 60)
    print("  SYSTEM VALIDATION SUMMARY")
    print("=" * 60)
    
    cv_results = run_cross_validation(models, X, y)
    
    print("=" * 60)
    check_calibration(best_model, X_train, y_train, X_test, y_test)
    plot_roc_per_class(best_model, X_test, y_test)
    run_sensitivity_analysis(best_model, df, feature_names)
    is_leaking = check_data_leakage(df, feature_names)
    
    print("=" * 60)
    print("  VALIDATION COMPLETE")
    print("=" * 60)
    print(f"  Models Checked: {len(models)}")
    print(f"  Plots Generated: 3 (Saved to '{PLOTS_DIR.name}/')")
    print(f"  Leakage Status : {'FAILED' if is_leaking else 'PASSED'}")

if __name__ == "__main__":
    main()
