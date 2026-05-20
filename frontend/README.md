# ChurnSense AI — Frontend

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/CSS-Vanilla-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![Azure ML](https://img.shields.io/badge/Azure%20ML-REST%20API-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/machine-learning)

The React interface for ChurnSense AI. It accepts customer data through a validated form, posts it to a live Azure ML endpoint, and presents the prediction with a risk score, key contributing factors, and targeted retention recommendations.

---

## Problem Statement

Retention teams need a fast, self-service tool to assess individual customer churn risk without requiring data science expertise. This frontend bridges the gap between the trained ML model deployed on Azure and the business users who need to act on its output.

---

## Use Case

A customer success representative opens the app, enters details for a customer approaching renewal, and receives an instant risk verdict. Based on the result and the specific factors highlighted, they can decide whether to escalate the account, offer a discount, or suggest a contract upgrade — all before the customer raises a complaint or cancels.

---

## Features

* **Auto-Routing Endpoint:** Automatically routes traffic to the Azure ML cloud API if configured in `.env`, falling back to the local FastAPI server if no cloud credentials are provided.
* **Clean Input Form:** Collects all 6 model features (Age, Tenure, Monthly Charge, Total Charge, Contract, and Internet Service). Includes on-blur validation to prevent invalid runs.
* **Auto-calculated Total Billing:** Automatically computes the `Total Charge` field as you enter `Tenure` and `Monthly Charge` values.
* **Demo Shortcuts:** High-risk and low-risk profile buttons to instantly fill out the form for testing.
* **Visual Risk Bar:** Renders the risk score (0-100%) dynamically based on the model's verdict and customer history.
* **Risk Factor Chips:** Highlights the primary attributes driving the churn verdict (e.g. Month-to-month plan, Low tenure).
* **Targeted Recommendations:** Recommends specific customer success actions (e.g. offer loyalty gift, suggest contract upgrade) categorized by priority.
* **Local History Drawer:** Remembers your last 10 runs using the browser's `localStorage` so you can review or reload past profiles.

---

## Getting Started

1. Set up your environment variables if using Azure ML (see below).
2. Install dependencies and start the app:

```bash
npm install
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173). The application automatically checks for Azure ML environment variables. If present, it will connect to the Cloud API (Azure ML). Otherwise, it falls back to the Local API (FastAPI) automatically.

---

## Environment Variables

Copy `.env.example` to `.env` and set your Azure ML credentials:

```
VITE_AZURE_ML_URL=https://<your-endpoint>.inference.ml.azure.com/score
VITE_AZURE_ML_KEY=<your-primary-key>
```

The `.env` file is listed in `.gitignore` and must never be committed.

---

## Azure ML Payload Format

```json
{
  "input_data": {
    "columns": ["Age", "Tenure", "MonthlyCharge", "TotalCharge", "Contract", "InternetService"],
    "index": [0],
    "data": [[35, 12, 70.45, 845.40, "Month-to-month", "Fiber optic"]]
  }
}
```

Response is an array of integer predictions: `[0]` for no churn, `[1]` for churn.

---

## Tech Stack

| Technology | Role |
|---|---|
| React 18 | Component model, state, and lifecycle management |
| Vite 8 | HMR dev server, production bundler, dev proxy |
| Vanilla CSS | Custom design system with CSS variables, animations |
| Google Fonts — Inter, Outfit | Body and display typography |
| localStorage API | Client-side prediction history |
| Fetch API | HTTP communication with the Azure ML endpoint |
