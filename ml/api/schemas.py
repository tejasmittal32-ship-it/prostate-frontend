from pydantic import BaseModel, Field

class PatientInput(BaseModel):
    age: float = Field(..., ge=18, le=100)
    family_history: int = Field(..., ge=0, le=2)
    smoking: int = Field(..., ge=0, le=1)
    activity_level: int = Field(..., ge=0, le=2)
    psa: float = Field(..., ge=0, le=100)
    region: int = Field(..., ge=0, le=2)
    diet: int = Field(..., ge=0, le=2)
    pollution: int = Field(..., ge=0, le=2)
    bmi: float = Field(..., ge=10, le=60)
    alcohol: int = Field(..., ge=0, le=1)
    sleep_hours: float = Field(..., ge=0, le=24)

class PredictionResponse(BaseModel):
    risk: int
    risk_label: str
    probabilities: list[float]
    feature_contributions: dict[str, float]
    explanation: str
