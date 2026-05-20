# ChurnSense AI — Backend

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Uvicorn](https://img.shields.io/badge/Uvicorn-0.22%2B-499848?style=flat-square&logo=uvicorn&logoColor=white)](https://www.uvicorn.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3.2-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![MLflow](https://img.shields.io/badge/MLflow-2.19.0-0194E2?style=flat-square&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Azure ML](https://img.shields.io/badge/Azure%20ML-Managed%20Endpoint-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/machine-learning)

The machine learning backend for ChurnSense AI. Contains the training pipeline, the packaged MLflow model, a local FastAPI server, and a test script for validating the deployed Azure ML endpoint.

---

## Problem Statement

Subscription businesses need a reliable, automated way to identify customers likely to churn before they actually cancel. This backend trains a classification model on structured customer data and hosts it via a local FastAPI microservice or deploys it as a managed REST endpoint on Azure ML, enabling client applications to query churn risk in real time.

---

## Use Case

The model serves as the scoring engine behind ChurnSense AI. Once deployed or run locally, any client application can POST customer attributes in a standardised payload and receive a binary prediction. The scoring service handles pipeline execution (preprocessing + prediction) internally, making integration simple.

---

## Features

* **Synthetic Data Generation:** Includes `churn_pipeline.py` to create a 1,000-row dummy customer dataset containing realistic churn signals based on pricing and contract types.
* **Single-Fit Pipeline:** Bundles scaling (`StandardScaler` for numeric values) and encoding (`OneHotEncoder` for categories) together with a `RandomForestClassifier` to prevent data leakage.
* **FastAPI Service:** Runs a local web server via `app.py` on port 8000 that loads the trained model and processes incoming JSON payloads.
* **Azure ML Ready:** Packages the entire pipeline in MLflow format inside `churn_model_mlflow/` with input signatures, ready to register and deploy on Azure.
* **Endpoint Test Script:** Includes `test_endpoint.py` to quickly query the deployed REST API and verify the network connection.

---

## Model Details

| Attribute | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Estimators | 100 |
| Numeric features | Age, Tenure, MonthlyCharge, TotalCharge |
| Categorical features | Contract, InternetService |
| Preprocessing | StandardScaler + OneHotEncoder |
| Output | Binary integer: 0 (no churn) or 1 (churn) |
| MLflow version | 2.19.0 |
| scikit-learn version | 1.3.2 |

---

## Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python churn_pipeline.py
```
This generates `dummy_churn_data.csv` and saves the model to `churn_model.pkl` and `churn_model_mlflow/`.

### 3. Run FastAPI Locally
```bash
python app.py
```
The server starts at `http://127.0.0.1:8000`. You can test it using the interactive docs at `/docs` or by routing frontend predictions to the local API.

### 4. Deploying to Azure ML (Optional)
- Register the `churn_model_mlflow` folder in Azure ML Studio.
- Deploy the model to a Managed Online Endpoint.
- Update `test_endpoint.py` with your endpoint URL/key to verify.

---

## Scoring Payload

```json
{
  "input_data": {
    "columns": ["Age", "Tenure", "MonthlyCharge", "TotalCharge", "Contract", "InternetService"],
    "index": [0],
    "data": [[35, 12, 70.45, 845.40, "Month-to-month", "Fiber optic"]]
  }
}
```

---

## Tech Stack

| Technology | Role |
|---|---|
| Python 3.11 | Runtime |
| FastAPI | Local API framework |
| Uvicorn | ASGI server |
| scikit-learn 1.3.2 | Pipeline, Random Forest |
| MLflow 2.19.0 | Model packaging |
| pandas / NumPy | Data generation and preprocessing |
| Azure ML | Managed hosting & registry |
