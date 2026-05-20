// Credentials are loaded from .env (VITE_ prefix exposes them to the browser bundle).
const HAS_CLOUD_CONFIG = !!(import.meta.env.VITE_AZURE_ML_URL && import.meta.env.VITE_AZURE_ML_KEY);

export const USE_CLOUD = HAS_CLOUD_CONFIG;

// Select Cloud or Local URL based on environment config availability
export const TARGET_URL = USE_CLOUD
  ? (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? '/api/score'
      : import.meta.env.VITE_AZURE_ML_URL)
  : (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? '/api/score-local'
      : 'http://127.0.0.1:8000/score');

export const API_KEY = import.meta.env.VITE_AZURE_ML_KEY || '';

export const CONTRACT_OPTIONS = ['Month-to-month', 'One year', 'Two year'];
export const INTERNET_OPTIONS = ['DSL', 'Fiber optic', 'No'];

// ── Prediction History (persisted in localStorage) ──────────────────────────
const HISTORY_KEY = 'churnsense_history';
const MAX_HISTORY = 10;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(entry) {
  const history = loadHistory();
  // Most-recent first, capped at MAX_HISTORY
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Build the Azure ML input_data payload from form values.
 */
export function buildPayload(formData) {
  return {
    input_data: {
      columns: ['Age', 'Tenure', 'MonthlyCharge', 'TotalCharge', 'Contract', 'InternetService'],
      index: [0],
      data: [
        [
          parseInt(formData.age, 10),
          parseInt(formData.tenure, 10),
          parseFloat(formData.monthlyCharge),
          parseFloat(formData.totalCharge),
          formData.contract,
          formData.internetService,
        ],
      ],
    },
  };
}

/**
 * Call the prediction endpoint and return result.
 * Returns an array like [0] or [1]; 1 = Churn, 0 = No Churn.
 */
export async function predictChurn(formData) {
  const payload = buildPayload(formData);
  const targetUrl = TARGET_URL;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (USE_CLOUD) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const rawPrediction = Array.isArray(result) ? result[0] : result;
  return rawPrediction;
}

/**
 * Compute a heuristic risk score (0–100) based on the input data.
 * This supplements the binary prediction with a more nuanced number.
 */
export function computeRiskScore(formData, isChurn) {
  let score = isChurn ? 60 : 20;

  const tenure = parseInt(formData.tenure, 10);
  const monthly = parseFloat(formData.monthlyCharge);

  if (formData.contract === 'Month-to-month') score += 15;
  else if (formData.contract === 'Two year') score -= 10;

  if (tenure < 6) score += 15;
  else if (tenure < 12) score += 8;
  else if (tenure > 36) score -= 10;

  if (monthly > 90) score += 12;
  else if (monthly > 70) score += 6;
  else if (monthly < 40) score -= 5;

  if (formData.internetService === 'Fiber optic') score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate contextual suggestions based on the prediction and input data.
 */
export function generateSuggestions(formData, isChurn) {
  const suggestions = [];
  const tenure = parseInt(formData.tenure, 10);
  const monthly = parseFloat(formData.monthlyCharge);
  const age = parseInt(formData.age, 10);

  if (isChurn) {
    if (formData.contract === 'Month-to-month') {
      suggestions.push({
        priority: 'high',
        heading: 'Offer Contract Upgrade',
        text: 'Customer is on a month-to-month plan — the biggest churn driver. Offer a discounted 1 or 2-year contract with a locked-in rate.',
      });
    }

    if (tenure >= 12) {
      suggestions.push({
        priority: 'high',
        heading: 'Loyalty Reward Program',
        text: `Customer has been with you for ${tenure} months. Send a personalized loyalty gift or exclusive discount to reinforce their value.`,
      });
    }

    if (monthly > 80) {
      suggestions.push({
        priority: 'medium',
        heading: 'Review Pricing Plan',
        text: `Monthly charge of $${monthly.toFixed(2)} is above average. Consider offering a promotional bundle or rate reduction to retain this customer.`,
      });
    }

    if (tenure < 6) {
      suggestions.push({
        priority: 'high',
        heading: 'Early Engagement Campaign',
        text: 'New customers under 6 months are highly susceptible to churn. Launch an onboarding check-in call or guided setup session immediately.',
      });
    }

    if (formData.internetService === 'Fiber optic' && formData.contract === 'Month-to-month') {
      suggestions.push({
        priority: 'medium',
        heading: 'Fiber Service Satisfaction Survey',
        text: 'Fiber optic customers on flexible plans churn more. Send a satisfaction survey and address any service complaints proactively.',
      });
    }

    suggestions.push({
      priority: 'medium',
      heading: 'Schedule Retention Call',
      text: 'Assign a dedicated customer success rep to reach out within 48 hours. Personal outreach significantly reduces churn probability.',
    });
  } else {
    if (formData.contract !== 'Two year') {
      suggestions.push({
        priority: 'low',
        heading: 'Upsell Longer Contract',
        text: 'Customer shows low churn risk. This is a great time to upsell a 2-year plan for higher LTV and better retention guarantee.',
      });
    }

    if (monthly < 50) {
      suggestions.push({
        priority: 'low',
        heading: 'Cross-Sell Premium Features',
        text: `Customer spend is relatively low at $${monthly.toFixed(2)}/mo. Offer relevant premium add-ons or service bundles to increase ARPU.`,
      });
    }

    if (tenure > 24) {
      suggestions.push({
        priority: 'low',
        heading: 'Request Referral or Review',
        text: `${tenure} months of loyalty signals a satisfied customer. Ask them for a referral or a product review to grow your customer base.`,
      });
    }

    if (age > 55) {
      suggestions.push({
        priority: 'low',
        heading: 'Senior Loyalty Perks',
        text: 'Offer senior-specific discounts or simplified plan options to deepen loyalty and prevent future churn risk.',
      });
    }

    suggestions.push({
      priority: 'low',
      heading: 'Maintain Engagement',
      text: 'Continue regular satisfaction check-ins every quarter to keep this customer happy and identify upsell opportunities early.',
    });
  }

  return suggestions.slice(0, 4); // Cap at 4 suggestions
}
