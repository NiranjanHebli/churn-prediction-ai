import pandas as pd
import numpy as np
import joblib
import os
import mlflow
import mlflow.sklearn
from mlflow.models import infer_signature
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

def generate_dummy_data(num_samples=1000, random_state=42):
    """Generates a dummy dataset for churn prediction."""
    np.random.seed(random_state)
    
    # Generate numerical features
    age = np.random.randint(18, 80, size=num_samples)
    tenure = np.random.randint(1, 72, size=num_samples)
    monthly_charge = np.random.uniform(20, 120, size=num_samples)
    total_charge = tenure * monthly_charge + np.random.normal(0, 10, size=num_samples)
    
    # Generate categorical features
    contract_types = ['Month-to-month', 'One year', 'Two year']
    internet_services = ['DSL', 'Fiber optic', 'No']
    
    contract = np.random.choice(contract_types, size=num_samples, p=[0.5, 0.3, 0.2])
    internet = np.random.choice(internet_services, size=num_samples, p=[0.3, 0.5, 0.2])
    
    # Generate target variable (Churn)
    # Higher chance of churn if month-to-month, higher monthly charge, lower tenure
    churn_prob = np.zeros(num_samples)
    churn_prob += np.where(contract == 'Month-to-month', 0.3, 0.0)
    churn_prob += np.where(tenure < 12, 0.2, 0.0)
    churn_prob += np.where(monthly_charge > 80, 0.2, 0.0)
    churn_prob -= np.where(contract == 'Two year', 0.2, 0.0)
    
    # Add some random noise and clip probabilities to [0.05, 0.95]
    churn_prob += np.random.normal(0, 0.1, size=num_samples)
    churn_prob = np.clip(churn_prob, 0.05, 0.95)
    
    # Sample churn based on probabilities
    churn = np.random.binomial(1, churn_prob)
    
    # Create DataFrame
    df = pd.DataFrame({
        'CustomerID': [f'CUST_{i:04d}' for i in range(1, num_samples + 1)],
        'Age': age,
        'Tenure': tenure,
        'MonthlyCharge': monthly_charge,
        'TotalCharge': total_charge,
        'Contract': contract,
        'InternetService': internet,
        'Churn': churn
    })
    
    return df

def build_pipeline():
    """Builds a scikit-learn pipeline for churn prediction."""
    # Define features
    numeric_features = ['Age', 'Tenure', 'MonthlyCharge', 'TotalCharge']
    categorical_features = ['Contract', 'InternetService']
    
    # Create preprocessing steps
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # Combine preprocessing steps using ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    # Create the final pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    return pipeline

def main():
    print("Generating dummy dataset...")
    df = generate_dummy_data(num_samples=1000)
    print(f"Dataset shape: {df.shape}")
    print("\nFirst few rows:")
    print(df.head())
    
    # Save the dataset to a CSV file (optional)
    csv_filename = 'dummy_churn_data.csv'
    df.to_csv(csv_filename, index=False)
    print(f"\nDataset saved to '{csv_filename}'")
    
    # Prepare data for modeling
    X = df.drop(['CustomerID', 'Churn'], axis=1)
    y = df['Churn']
    
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"\nTraining set size: {X_train.shape[0]}")
    print(f"Testing set size: {X_test.shape[0]}")
    
    print("\nBuilding and training the pipeline...")
    pipeline = build_pipeline()
    
    # Train the model
    pipeline.fit(X_train, y_train)
    
    print("\n Evaluating the model...")
    # Make predictions
    y_pred = pipeline.predict(X_test)
    
    # Evaluate performance
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nSaving the model for Azure ML Registration (MLflow format)...")
    mlflow_model_dir = 'churn_model_mlflow'
    if os.path.exists(mlflow_model_dir):
        import shutil
        shutil.rmtree(mlflow_model_dir)
        
    signature = infer_signature(X_train, pipeline.predict(X_train))
    mlflow.sklearn.save_model(
        sk_model=pipeline,
        path=mlflow_model_dir,
        signature=signature
    )
    print(f"Model successfully saved in MLflow format to the folder '{mlflow_model_dir}'")
    print("In the Azure ML Studio UI, select 'MLflow' as the Model type and upload this entire folder.")

if __name__ == "__main__":
    main()
