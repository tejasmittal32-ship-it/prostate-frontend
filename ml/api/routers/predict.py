from fastapi import APIRouter, Request, HTTPException
from api.schemas import PatientInput, PredictionResponse
from src.explainability import predict_risk

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientInput, request: Request):
    artifacts = request.app.state.artifacts
    
    # Preprocessing: engineering the dependent feature exactly matching pipeline logic
    psa_density = patient.psa / patient.bmi if patient.bmi > 0 else 0.0
    
    # Ensure all features exist in a dictionary with strictly correct mapping
    features_dict = {
        "age": patient.age,
        "psa": patient.psa,
        "bmi": patient.bmi,
        "sleep_hours": patient.sleep_hours,
        "psa_density": psa_density,
        "family_history": patient.family_history,
        "smoking": patient.smoking,
        "activity_level": patient.activity_level,
        "region": patient.region,
        "diet": patient.diet,
        "pollution": patient.pollution,
        "alcohol": patient.alcohol
    }
    
    # Enforce precise training feature order to avoid silent errors
    features_dict = {k: features_dict[k] for k in artifacts["feature_names"]}
    
    try:
        # Run the modular prediction and evaluation safely.
        result = predict_risk(raw_features=features_dict, artifacts=artifacts, top_n=5)
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed")
    
    return PredictionResponse(**result)
