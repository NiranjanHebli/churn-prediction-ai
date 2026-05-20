import { useState, useEffect, useRef } from 'react';
import {
  predictChurn,
  computeRiskScore,
  generateSuggestions,
  CONTRACT_OPTIONS,
  INTERNET_OPTIONS,
  loadHistory,
  saveToHistory,
  clearHistory,
  USE_CLOUD,
} from './api';
import './index.css';

const DEFAULT_FORM = {
  age: '',
  tenure: '',
  monthlyCharge: '',
  totalCharge: '',
  contract: 'Month-to-month',
  internetService: 'Fiber optic',
};

// Validation rules
function validate(formData) {
  const errors = {};
  const age = parseInt(formData.age, 10);
  const tenure = parseInt(formData.tenure, 10);
  const monthly = parseFloat(formData.monthlyCharge);
  const total = parseFloat(formData.totalCharge);

  if (!formData.age || isNaN(age) || age < 18 || age > 100)
    errors.age = 'Age must be between 18 and 100';
  if (!formData.tenure || isNaN(tenure) || tenure < 1 || tenure > 72)
    errors.tenure = 'Tenure must be between 1 and 72 months';
  if (!formData.monthlyCharge || isNaN(monthly) || monthly <= 0)
    errors.monthlyCharge = 'Enter a valid monthly charge (> $0)';
  if (!formData.totalCharge || isNaN(total) || total <= 0)
    errors.totalCharge = 'Enter a valid total charge (> $0)';

  return errors;
}

function App() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Auto-compute TotalCharge from Tenure x Monthly
  useEffect(() => {
    const tenure = parseFloat(formData.tenure);
    const monthly = parseFloat(formData.monthlyCharge);
    if (!isNaN(tenure) && !isNaN(monthly) && tenure > 0 && monthly > 0) {
      setFormData((prev) => ({
        ...prev,
        totalCharge: (tenure * monthly).toFixed(2),
      }));
    }
  }, [formData.tenure, formData.monthlyCharge]);

  const errors = validate(formData);
  const isFormValid = Object.keys(errors).length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ age: true, tenure: true, monthlyCharge: true, totalCharge: true });
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prediction = await predictChurn(formData);
      const isChurn = prediction === 1 || prediction === '1' || prediction === true;
      const riskScore = computeRiskScore(formData, isChurn);
      const suggestions = generateSuggestions(formData, isChurn);
      const timestamp = new Date().toISOString();

      const newResult = { isChurn, riskScore, suggestions, snapshot: { ...formData }, timestamp };
      setResult(newResult);

      const updatedHistory = saveToHistory({ isChurn, riskScore, snapshot: { ...formData }, timestamp });
      setHistory(updatedHistory);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
    setTouched({});
    setResult(null);
    setError(null);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleLoadFromHistory = (entry) => {
    setFormData({ ...entry.snapshot });
    setTouched({});
    setResult(null);
    setError(null);
    setShowHistory(false);
  };

  const fieldError = (name) => touched[name] && errors[name];

  return (
    <div className="app">
      <div className="bg-mesh" />

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon">CS</div>
              <div>
                <div className="logo-text">ChurnSense AI</div>
                <div className="logo-sub">Powered by Azure ML</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {history.length > 0 && (
                <button
                  id="history-btn"
                  className="history-toggle-btn"
                  onClick={() => setShowHistory((s) => !s)}
                  title="View prediction history"
                >
                  History
                  <span className="history-badge">{history.length}</span>
                </button>
              )}
              <div className="header-badge">
                <div className="status-dot" />
                {USE_CLOUD ? 'Cloud API' : 'Local API'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* History Drawer */}
      {showHistory && (
        <div className="history-drawer">
          <div className="container">
            <div className="history-header">
              <span className="history-title">Recent Predictions</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="history-clear-btn" onClick={handleClearHistory}>
                  Clear All
                </button>
                <button className="history-close-btn" onClick={() => setShowHistory(false)}>X</button>
              </div>
            </div>
            <div className="history-list">
              {history.map((entry, i) => (
                <button
                  key={i}
                  id={`history-entry-${i}`}
                  className={`history-item ${entry.isChurn ? 'churn' : 'safe'}`}
                  onClick={() => handleLoadFromHistory(entry)}
                >
                  <span className="history-item-icon">{entry.isChurn ? 'H' : 'L'}</span>
                  <div className="history-item-body">
                    <div className="history-item-verdict">
                      {entry.isChurn ? 'Will Churn' : 'Retained'} — {entry.riskScore}% risk
                    </div>
                    <div className="history-item-meta">
                      Age {entry.snapshot.age} · {entry.snapshot.tenure}mo · ${parseFloat(entry.snapshot.monthlyCharge).toFixed(0)}/mo · {entry.snapshot.contract}
                    </div>
                    <div className="history-item-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="history-item-load">Load</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            Machine Learning Prediction
          </div>
          <h1 className="hero-title">
            Predict Customer <span className="highlight">Churn Risk</span>
            <br />
            Before It Happens
          </h1>
          <p className="hero-desc">
            Enter customer data to get an instant AI-powered churn prediction with
            personalized retention strategies and risk analysis.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">6</span>
              <span className="hero-stat-label">Input Features</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">RF</span>
              <span className="hero-stat-label">Algorithm</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">~1s</span>
              <span className="hero-stat-label">Response Time</span>
            </div>
            {history.length > 0 && (
              <>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">{history.length}</span>
                  <span className="hero-stat-label">Predictions</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="main-content">
        <div className="container">
          <div className="content-grid">

            {/* Form Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                <h2 className="card-title" style={{ margin: 0 }}>Customer Profile</h2>
              </div>
              <p className="card-subtitle">
                Fill in the customer details below. Total Charge auto-calculates from Tenure x Monthly Charge.
              </p>

              <form id="churn-form" onSubmit={handleSubmit} noValidate>
                <div className="form-grid">

                  <div className="form-group">
                    <label className="form-label" htmlFor="age">
                      Age <span className="label-badge numeric">Numeric</span>
                    </label>
                    <input
                      id="age" type="number" name="age"
                      className={`form-input ${fieldError('age') ? 'input-error' : ''}`}
                      placeholder="e.g. 35" min="18" max="100"
                      value={formData.age}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                    {fieldError('age')
                      ? <span className="form-error">{errors.age}</span>
                      : <span className="form-hint">Customer age (18–100)</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="tenure">
                      Tenure <span className="label-badge numeric">Numeric</span>
                    </label>
                    <input
                      id="tenure" type="number" name="tenure"
                      className={`form-input ${fieldError('tenure') ? 'input-error' : ''}`}
                      placeholder="e.g. 12" min="1" max="72"
                      value={formData.tenure}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                    {fieldError('tenure')
                      ? <span className="form-error">{errors.tenure}</span>
                      : <span className="form-hint">Months with company (1–72)</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="monthlyCharge">
                      Monthly Charge <span className="label-badge numeric">Numeric</span>
                    </label>
                    <input
                      id="monthlyCharge" type="number" name="monthlyCharge"
                      className={`form-input ${fieldError('monthlyCharge') ? 'input-error' : ''}`}
                      placeholder="e.g. 70.45" step="0.01" min="0"
                      value={formData.monthlyCharge}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                    {fieldError('monthlyCharge')
                      ? <span className="form-error">{errors.monthlyCharge}</span>
                      : <span className="form-hint">Monthly billing amount ($)</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="totalCharge">
                      Total Charge <span className="label-badge numeric">Numeric</span>
                    </label>
                    <input
                      id="totalCharge" type="number" name="totalCharge"
                      className={`form-input ${fieldError('totalCharge') ? 'input-error' : ''} auto-calc`}
                      placeholder="Auto-calculated" step="0.01" min="0"
                      value={formData.totalCharge}
                      onChange={handleChange} onBlur={handleBlur}
                    />
                    {fieldError('totalCharge')
                      ? <span className="form-error">{errors.totalCharge}</span>
                      : <span className="form-hint">Cumulative billing amount ($)</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contract">
                      Contract <span className="label-badge category">Category</span>
                    </label>
                    <div className="select-wrapper">
                      <select id="contract" name="contract" className="form-select"
                        value={formData.contract} onChange={handleChange}>
                        {CONTRACT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <span className="form-hint">Type of service agreement</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="internetService">
                      Internet Service <span className="label-badge category">Category</span>
                    </label>
                    <div className="select-wrapper">
                      <select id="internetService" name="internetService" className="form-select"
                        value={formData.internetService} onChange={handleChange}>
                        {INTERNET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <span className="form-hint">Type of internet subscription</span>
                  </div>

                </div>

                <div className="quick-fill">
                  <span className="quick-fill-label">Quick fill:</span>
                  <button type="button" className="quick-fill-btn" id="example-high-risk"
                    onClick={() => { setFormData({ age: '28', tenure: '3', monthlyCharge: '95', totalCharge: '285', contract: 'Month-to-month', internetService: 'Fiber optic' }); setTouched({}); }}>
                    High Risk Example
                  </button>
                  <button type="button" className="quick-fill-btn" id="example-low-risk"
                    onClick={() => { setFormData({ age: '45', tenure: '48', monthlyCharge: '42', totalCharge: '2016', contract: 'Two year', internetService: 'DSL' }); setTouched({}); }}>
                    Low Risk Example
                  </button>
                </div>

                <button id="predict-btn" type="submit" className="submit-btn" disabled={loading}>
                  {loading
                    ? <><div className="spinner" /> Analyzing with Azure ML...</>
                    : 'Predict Churn Risk'
                  }
                </button>
              </form>
            </div>

            {/* Result Panel */}
            <div className="result-panel" ref={resultRef}>
              {error && (
                <div className="error-card">
                  <span className="error-icon">!</span>
                  <div>
                    <div className="error-title">Prediction Failed</div>
                    <div className="error-message">{error}</div>
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="placeholder-card">
                  <div className="placeholder-icon">AI</div>
                  <div className="placeholder-title">Awaiting Prediction</div>
                  <p className="placeholder-desc">
                    Fill in the customer profile and click <strong>"Predict Churn Risk"</strong> to see results here.
                  </p>
                </div>
              )}

              {result && (
                <>
                  <div className={`churn-result-card ${result.isChurn ? 'churn-yes' : 'churn-no'}`}>
                    <div className="result-glow" />
                    <div className="result-header">
                      <div>
                        <div className="result-label">Prediction Result</div>
                        <div className="result-verdict">
                          {result.isChurn ? 'Will Churn' : 'Retained'}
                        </div>
                        <div className="result-desc">
                          {result.isChurn
                            ? 'This customer is at high risk of leaving. Immediate retention action recommended.'
                            : 'This customer shows low churn risk. Focus on upsell and continued engagement.'}
                        </div>
                      </div>
                      <div className="result-icon result-icon-text">
                        {result.isChurn ? 'HIGH' : 'LOW'}
                      </div>
                    </div>

                    <div className="risk-meter">
                      <div className="risk-meter-header">
                        <span className="risk-meter-label">Risk Score</span>
                        <span className="risk-meter-value"
                          style={{ color: result.isChurn ? 'var(--danger)' : 'var(--success)' }}>
                          {result.riskScore}%
                        </span>
                      </div>
                      <div className="risk-bar">
                        <div className="risk-bar-fill" style={{ width: `${result.riskScore}%` }} />
                      </div>
                    </div>

                    <div className="key-factors">
                      <div className="key-factors-title">Key Factors Detected</div>
                      <div className="factor-chips">
                        <ChurnFactors data={result.snapshot} isChurn={result.isChurn} />
                      </div>
                    </div>
                  </div>

                  <div className="suggestions-card">
                    <div className="suggestions-title">Retention Recommendations</div>
                    <div className="suggestions-desc">
                      AI-generated action plan based on this customer profile
                    </div>
                    <div className="suggestion-list">
                      {result.suggestions.map((s, i) => (
                        <div key={i} className="suggestion-item">
                          <div className={`suggestion-icon-wrap priority-${s.priority}`}>
                            <span className="suggestion-priority-label">{s.priority.toUpperCase()}</span>
                          </div>
                          <div className="suggestion-body">
                            <div className="suggestion-heading">{s.heading}</div>
                            <div className="suggestion-text">{s.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-title">Input Summary</div>
                    <div className="summary-grid">
                      {[
                        { label: 'Age', value: `${result.snapshot.age} yrs` },
                        { label: 'Tenure', value: `${result.snapshot.tenure} months` },
                        { label: 'Monthly Charge', value: `$${parseFloat(result.snapshot.monthlyCharge).toFixed(2)}` },
                        { label: 'Total Charge', value: `$${parseFloat(result.snapshot.totalCharge).toFixed(2)}` },
                        { label: 'Contract', value: result.snapshot.contract },
                        { label: 'Internet', value: result.snapshot.internetService },
                      ].map((item) => (
                        <div key={item.label} className="summary-item">
                          <span className="summary-item-label">{item.label}</span>
                          <span className="summary-item-value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button id="reset-btn" onClick={handleReset} className="submit-btn"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'none' }}>
                    Predict Another Customer
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            Powered by <strong>Azure ML</strong> · Random Forest Classifier ·
            Features: Age, Tenure, MonthlyCharge, TotalCharge, Contract, InternetService
          </p>
        </div>
      </footer>
    </div>
  );
}

function ChurnFactors({ data, isChurn }) {
  const chips = [];
  const tenure = parseInt(data.tenure, 10);
  const monthly = parseFloat(data.monthlyCharge);

  if (data.contract === 'Month-to-month')
    chips.push({ label: 'Month-to-Month', type: isChurn ? 'risk' : 'neutral' });
  else if (data.contract === 'Two year')
    chips.push({ label: '2-Year Contract', type: 'safe' });
  else
    chips.push({ label: '1-Year Contract', type: 'neutral' });

  if (tenure < 12) chips.push({ label: `Low Tenure (${tenure}mo)`, type: isChurn ? 'risk' : 'neutral' });
  else if (tenure > 36) chips.push({ label: `Long Tenure (${tenure}mo)`, type: 'safe' });

  if (monthly > 80) chips.push({ label: `High Charge ($${monthly.toFixed(0)})`, type: isChurn ? 'risk' : 'neutral' });
  else if (monthly < 40) chips.push({ label: `Low Charge ($${monthly.toFixed(0)})`, type: 'safe' });

  if (data.internetService === 'Fiber optic') chips.push({ label: 'Fiber Optic', type: 'neutral' });
  else if (data.internetService === 'No') chips.push({ label: 'No Internet', type: 'safe' });

  return chips.map((c, i) => (
    <span key={i} className={`factor-chip ${c.type}`}>
      {c.label}
    </span>
  ));
}

export default App;
