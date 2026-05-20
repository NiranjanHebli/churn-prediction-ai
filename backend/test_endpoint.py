import urllib.request
import json
import ssl
import os

# Try loading environment variables from a local .env file in the same directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

def allowSelfSignedHttps(allowed):
    # Bypasses the server certificate verification on client side
    if allowed and not ssl._create_unverified_context:
        ssl._create_default_https_context = ssl._create_unverified_context

allowSelfSignedHttps(True)

# Test payload matching the signature of your churn model
data = {
    "input_data": {
        "columns": [
            "Age", 
            "Tenure", 
            "MonthlyCharge", 
            "TotalCharge", 
            "Contract", 
            "InternetService"
        ],
        "index": [0],
        "data": [
            [35, 12, 70.45, 845.40, "Month-to-month", "Fiber optic"]
        ]
    }
}

body = str.encode(json.dumps(data))

url = os.environ.get('AZURE_ML_URL', '')
api_key = os.environ.get('AZURE_ML_KEY', '')

if not api_key:
    print("WARNING: Please set the AZURE_ML_KEY environment variable or define it in a .env file.")
else:
    headers = {'Content-Type': 'application/json', 'Authorization': ('Bearer ' + api_key)}
    req = urllib.request.Request(url, body, headers)

    try:
        response = urllib.request.urlopen(req)
        result = response.read()
        print("Response status: 200 OK")
        print("Prediction result:")
        print(json.loads(result))
    except urllib.error.HTTPError as error:
        print("The request failed with status code: " + str(error.code))
        print("Headers:")
        print(error.info())
