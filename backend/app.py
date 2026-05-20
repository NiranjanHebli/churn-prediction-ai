import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any

app = FastAPI(
    title="ChurnSense AI Local API",
    description="Local FastAPI wrapper around the Churn Prediction RandomForest model pipeline.",
    version="1.0.0"
)

# Enable CORS so frontend can call it directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model pipeline
# We try loading churn_model.pkl first, then fall back to the MLflow model.pkl
MODEL_PATH = os.path.join(os.path.dirname(__file__), "churn_model.pkl")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "churn_model_mlflow", "model.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please run churn_pipeline.py first.")

try:
    model = joblib.load(MODEL_PATH)
    print(f"Loaded model successfully from {MODEL_PATH}")
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {str(e)}")


# Pydantic schemas mirroring the Azure ML payload structure
class InputData(BaseModel):
    columns: List[str]
    index: List[int]
    data: List[List[Any]]

class ScoringPayload(BaseModel):
    input_data: InputData


@app.get("/")
def read_root():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }


@app.post("/score")
def score(payload: ScoringPayload):
    try:
        # Validate columns
        expected_columns = ["Age", "Tenure", "MonthlyCharge", "TotalCharge", "Contract", "InternetService"]
        if payload.input_data.columns != expected_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid columns. Expected: {expected_columns}, Got: {payload.input_data.columns}"
            )
        
        # Convert incoming data list to pandas DataFrame
        df = pd.DataFrame(payload.input_data.data, columns=payload.input_data.columns)
        
        # Predict using the loaded sklearn pipeline
        predictions = model.predict(df)
        
        # Return predictions as an array of ints to match Azure ML format
        result = [int(p) for p in predictions]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
