# ChurnSense AI

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3.2-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![MLflow](https://img.shields.io/badge/MLflow-2.19.0-0194E2?style=flat-square&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Azure ML](https://img.shields.io/badge/Azure%20ML-Endpoint-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/machine-learning)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](https://opensource.org/licenses/MIT)

A full-stack machine learning application that predicts customer churn in real time. A Random Forest model is trained and packaged using MLflow, deployed as a REST endpoint on Azure ML, and surfaced through a modern React interface that delivers predictions and retention recommendations in under one second.

---

## Problem Statement

Customer churn is one of the most costly problems in subscription-based businesses. Companies often identify departing customers only after they have already cancelled, leaving little opportunity for intervention. Proactive retention requires a system that can score every customer before churn occurs — using existing data that businesses already collect, such as contract type, tenure, and monthly spend.

---

## Use Case

A customer success or revenue operations team uses ChurnSense AI to:

- Flag at-risk accounts before renewal dates
- Prioritise outreach queues based on predicted churn risk
- Equip retention agents with specific, data-driven talking points
- Monitor how contract changes and pricing adjustments affect churn scores over time

The tool is designed for non-technical users: a rep enters customer details into the form and receives an instant verdict with a scored risk percentage and a set of suggested actions.

---

## Features

* **Auto-Routing Endpoint:** Automatically routes prediction requests to the Azure ML cloud API when configured via environment variables, falling back to the local FastAPI server if no cloud credentials are provided.
* **Instant Risk Verdict & Score:** Scores churn risk from 0% to 100% using a combination of the model output and key customer factors, showing the result in a clean progress bar.
* **Key Risk Factors:** Pinpoints why a customer might churn (such as high monthly charges or month-to-month contracts) and displays them as status chips.
* **Actionable Retention Tips:** Automatically shows up to 4 priority-based steps (high/medium/low priority) to help retain the customer based on their profile.
* **Local Prediction History:** Stores the last 10 predictions in `localStorage`. You can click any past prediction to reload it back into the form.
* **Demo Shortcuts:** Includes quick-fill buttons for high-risk and low-risk profiles so you can test the prediction paths immediately.
* **Smart Input Fields:** Automatically calculates `Total Charge` as you type in `Tenure` and `Monthly Charge`. Validates fields on blur to prevent empty or invalid submissions.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Python 3.11 | Model training and data generation |
| scikit-learn 1.3.2 | Random Forest Classifier, preprocessing pipeline |
| MLflow 2.19.0 | Model serialisation, signature inference, packaging |
| Azure Machine Learning | Model registry, managed online endpoint, REST scoring |
| pandas / NumPy | Data manipulation and feature engineering |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI component framework |
| Vite 8 | Development server and production bundler |
| Vanilla CSS | Custom design system, dark mode, animations |
| Google Fonts (Inter, Outfit) | Typography |
| localStorage API | Client-side prediction history persistence |

---

## Future Scope

- **Batch prediction** — Allow upload of a CSV file to score multiple customers at once and export results with risk tiers.
- **Probability scores from model** — Replace the heuristic risk score with the actual class probability returned by the Random Forest, providing a more calibrated confidence measure.
- **SHAP explainability** — Integrate SHAP values into the API response so the UI can display exact per-feature contribution instead of rule-based factor chips.
- **Dashboard analytics** — Add a summary view showing churn rate trends, average risk scores, and intervention outcomes over time across all scored customers.
- **CRM integration** — Connect to Salesforce or HubSpot to automatically create tasks or update contact records when a high-risk prediction is made.
- **Multi-tenant support** — Extend the backend to support multiple business accounts, each with their own model version and endpoint configuration.
- **Model retraining pipeline** — Automate periodic retraining using Azure ML pipelines when new labelled data becomes available, with automated evaluation gating before deployment.
- **Authentication** — Add identity-based access control so only authorised users can access predictions and history.

---

## Getting Started

### 1. Run the Local FastAPI Server (Optional)

To predict using your local model instead of the Azure ML Cloud endpoint:

```bash
cd backend
pip install -r requirements.txt
python app.py
```
This runs the local API server at `http://127.0.0.1:8000`.

### 2. Run the React Frontend

To start the UI:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The application automatically checks for Azure ML environment variables. If present, it will connect to the Cloud API (Azure ML). Otherwise, it falls back to the Local API (FastAPI) automatically.
