from pydantic import BaseModel, Field
from typing import Dict, Optional


class ClaimInput(BaseModel):
    months_as_customer: int
    age: int
    policy_state: str
    policy_csl: str
    policy_deductable: int
    policy_annual_premium: float
    umbrella_limit: int
    insured_sex: str
    insured_education_level: str
    insured_occupation: str
    insured_hobbies: str
    insured_relationship: str
    capital_gains: float = Field(alias="capital-gains")
    capital_loss: float = Field(alias="capital-loss")
    incident_type: str
    collision_type: str
    incident_severity: str
    authorities_contacted: str
    incident_state: str
    incident_city: str
    incident_hour_of_the_day: int
    number_of_vehicles_involved: int
    property_damage: str
    bodily_injuries: int
    witnesses: int
    police_report_available: str
    total_claim_amount: float
    injury_claim: float
    property_claim: float
    vehicle_claim: float
    auto_make: str
    auto_year: int
    days_policy_to_incident: int

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "months_as_customer": 328,
                "age": 48,
                "policy_state": "OH",
                "policy_csl": "250/500",
                "policy_deductable": 1000,
                "policy_annual_premium": 1406.91,
                "umbrella_limit": 0,
                "insured_sex": "MALE",
                "insured_education_level": "MD",
                "insured_occupation": "craft-repair",
                "insured_hobbies": "sleeping",
                "insured_relationship": "husband",
                "capital-gains": 53300,
                "capital-loss": 0,
                "incident_type": "Single Vehicle Collision",
                "collision_type": "Side Collision",
                "incident_severity": "Major Damage",
                "authorities_contacted": "Police",
                "incident_state": "SC",
                "incident_city": "Columbus",
                "incident_hour_of_the_day": 5,
                "number_of_vehicles_involved": 1,
                "property_damage": "YES",
                "bodily_injuries": 1,
                "witnesses": 2,
                "police_report_available": "YES",
                "total_claim_amount": 71610,
                "injury_claim": 6510,
                "property_claim": 13020,
                "vehicle_claim": 52080,
                "auto_make": "Saab",
                "auto_year": 2004,
                "days_policy_to_incident": 5432
            }
        }


class PredictionResponse(BaseModel):
    risk_level: str
    probability: float
    prediction: int
    model_version: str
    baseline_risk: float
    shap_values: Dict[str, float]
    top_risk_factor: str


class ModelInfo(BaseModel):
    model_name: str
    version: str
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    alias: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool