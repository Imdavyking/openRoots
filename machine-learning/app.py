import pandas as pd
from flask import Flask, request, jsonify
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from flask_cors import CORS


import io

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Dictionary to hold the trained models for each dataset_id
trained_models = {}

# Function to train the model
def train_model(csv_data, model_type, target_column, dataset_id):
    # Read CSV data into a DataFrame
    df = pd.read_csv(io.StringIO(csv_data))
    
    # Separate features and target
    X = df.drop(columns=target_column)
    y = df[target_column]
    
    # Preprocessing (Standardizing numeric and encoding categorical features)
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object']).columns.tolist()
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(), categorical_features)
        ])
    
    # Select model type
    if model_type == "LinearRegression":
        model = LinearRegression()
    elif model_type == "RandomForest":
        model = RandomForestRegressor()
    elif model_type == "DecisionTree":
        model = DecisionTreeRegressor()
    else:
        raise ValueError("Invalid model type. Choose from 'LinearRegression', 'RandomForest', or 'DecisionTree'.")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', model)])
    
    # Train the model
    pipeline.fit(X, y)
    
    # Store the trained model using the dataset_id
    trained_models[dataset_id] = pipeline

# Function to make predictions
def make_predictions(input_data, dataset_id):
    if dataset_id not in trained_models:
        return None
    
    trained_model = trained_models[dataset_id]
    
    # Convert input data into DataFrame
    input_df = pd.DataFrame([input_data])
    
    # Predict using the trained model
    prediction = trained_model.predict(input_df)
    
    return prediction[0]

# Endpoint for training the model
@app.route('/train', methods=['POST'])
def train():
    data = request.get_json()
    
    # Get the CSV data, model type, target column, and dataset_id from the request
    csv_data = data.get('csv_data')
    model_type = data.get('model_type')
    target_column = data.get('target_column')
    dataset_id = data.get('dataset_id')
    
    if not csv_data or not model_type or not target_column or not dataset_id:
        return jsonify({"error": "Missing required parameters"}), 400
    
    try:
        # Train the model with the provided data and model type
        train_model(csv_data, model_type, target_column, dataset_id)
        return jsonify({"message": "Model trained successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
# Endpoint for / hello world
@app.route('/',methods=['GET'])
def hello():
    return "Hello, World!"

# Endpoint for making predictions
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # Get the dataset_id and input data for prediction
    dataset_id = data.get('dataset_id')
    input_data = data.get('input_data')
    
    if not dataset_id or not input_data:
        return jsonify({"error": "Missing required parameters"}), 400
    
    # Ensure model has been trained for the dataset_id
    if dataset_id not in trained_models:
        return jsonify({"error": "Model is not trained yet for this dataset"}), 400
    
    try:
        # Make prediction using the trained model
        prediction = make_predictions(input_data, dataset_id)
        
        if prediction is None:
            return jsonify({"error": "Prediction failed"}), 400
        
        return jsonify({"prediction": prediction})
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 400


# Endpoint to check if a model is trained for a specific dataset_id
@app.route('/check_model', methods=['GET'])
def check_model():
    # Get the dataset_id from the request
    dataset_id = request.args.get('dataset_id')
    
    if not dataset_id:
        return jsonify({"error": "Missing dataset_id parameter"}), 400
    
    # Check if the model exists for the given dataset_id
    if dataset_id in trained_models:
        return jsonify({"message": f"Model is trained for dataset_id: {dataset_id}"}), 200
    else:
        return jsonify({"message": f"No model found for dataset_id: {dataset_id}"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000,debug=True)
