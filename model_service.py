from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Carbon Footprint Prediction API",
    description="API for predicting carbon footprint emissions using AI/ML models",
    version="1.0.0"
)

# Model version
MODEL_VERSION = "1.0.0"

# Define input and output models
class PredictionInput(BaseModel):
    input_data: Dict[str, Any]
    prediction_type: str = Field(..., description="Type of prediction (scope1, scope2, scope3, total)")

class PredictionOutput(BaseModel):
    prediction: float
    confidence: Optional[float] = None
    model_version: str
    prediction_time: datetime
    prediction_type: str
    recommendations: Optional[List[str]] = None

# Simulated ML model for Scope 1 emissions (direct emissions)
def predict_scope1(data):
    """
    Simulate a Scope 1 emissions prediction model
    In a real implementation, this would use a trained ML model
    """
    # Extract features from input data
    energy_consumption = data.get("energy_consumption", 0)
    fuel_usage = data.get("fuel_usage", 0)
    num_vehicles = data.get("num_vehicles", 0)
    vehicle_miles = data.get("vehicle_miles", 0)
    
    # Simple formula for demonstration purposes
    # In reality, would use a trained ML model here
    base_emission = 10 + (energy_consumption * 0.5) + (fuel_usage * 0.8)
    vehicle_emission = num_vehicles * vehicle_miles * 0.2
    
    # Add some randomness to simulate model variance
    noise = np.random.normal(0, base_emission * 0.05)
    
    # Calculate total prediction
    prediction = base_emission + vehicle_emission + noise
    
    # Ensure non-negative result
    prediction = max(0, prediction)
    
    # Simulate a confidence score
    confidence = min(0.95, max(0.6, 0.9 - (abs(noise) / base_emission)))
    
    return prediction, confidence

# Simulated ML model for Scope 2 emissions (indirect emissions from purchased energy)
def predict_scope2(data):
    """
    Simulate a Scope 2 emissions prediction model
    """
    # Extract features from input data
    electricity_usage = data.get("electricity_usage", 0)
    renewable_percentage = data.get("renewable_percentage", 0)
    grid_factor = data.get("grid_factor", 0.5)  # Emission factor for the electricity grid
    
    # Simple formula for demonstration purposes
    base_emission = electricity_usage * grid_factor
    renewable_reduction = base_emission * (renewable_percentage / 100)
    
    # Add some randomness to simulate model variance
    noise = np.random.normal(0, base_emission * 0.03)
    
    # Calculate total prediction
    prediction = (base_emission - renewable_reduction) + noise
    
    # Ensure non-negative result
    prediction = max(0, prediction)
    
    # Simulate a confidence score
    confidence = min(0.98, max(0.7, 0.92 - (abs(noise) / (base_emission + 0.1))))
    
    return prediction, confidence

# Simulated ML model for Scope 3 emissions (other indirect emissions)
def predict_scope3(data):
    """
    Simulate a Scope 3 emissions prediction model
    """
    # Extract features from input data
    supply_chain_emissions = data.get("supply_chain_emissions", 0)
    business_travel = data.get("business_travel", 0)
    employee_commuting = data.get("employee_commuting", 0)
    waste_disposal = data.get("waste_disposal", 0)
    
    # Simple formula for demonstration purposes
    base_emission = supply_chain_emissions * 1.2
    travel_emission = business_travel * 0.3 + employee_commuting * 0.15
    waste_emission = waste_disposal * 0.4
    
    # Add some randomness to simulate model variance
    noise = np.random.normal(0, (base_emission + travel_emission) * 0.08)
    
    # Calculate total prediction
    prediction = base_emission + travel_emission + waste_emission + noise
    
    # Ensure non-negative result
    prediction = max(0, prediction)
    
    # Simulate a confidence score (Scope 3 tends to have lower confidence)
    confidence = min(0.85, max(0.5, 0.7 - (abs(noise) / (base_emission + 0.1))))
    
    return prediction, confidence

# Simulated ML model for total emissions
def predict_total(data):
    """
    Simulate a total emissions prediction model
    """
    # Predict individual scopes
    scope1_pred, _ = predict_scope1(data)
    scope2_pred, _ = predict_scope2(data)
    scope3_pred, _ = predict_scope3(data)
    
    # Sum them up
    total_pred = scope1_pred + scope2_pred + scope3_pred
    
    # Add some integrative adjustments
    adjustment = total_pred * np.random.uniform(-0.02, 0.02)
    
    # Add some randomness to simulate model variance
    noise = np.random.normal(0, total_pred * 0.02)
    
    # Calculate final prediction
    prediction = total_pred + adjustment + noise
    
    # Simulate a confidence score
    confidence = min(0.92, max(0.65, 0.85 - (abs(noise) / total_pred)))
    
    return prediction, confidence

# Function to generate recommendations based on emissions data
def generate_recommendations(data, prediction_type, prediction_value):
    """
    Generate recommendations for reducing emissions based on the prediction type and value
    """
    recommendations = []
    
    if prediction_type == "scope1":
        # Scope 1 recommendations
        if data.get("fuel_usage", 0) > 100:
            recommendations.append("Consider switching to more fuel-efficient vehicles or equipment")
        
        if data.get("vehicle_miles", 0) > 10000:
            recommendations.append("Implement a telecommuting policy to reduce vehicle miles")
        
        recommendations.append("Conduct an energy audit to identify direct emission reduction opportunities")
    
    elif prediction_type == "scope2":
        # Scope 2 recommendations
        if data.get("renewable_percentage", 0) < 20:
            recommendations.append("Increase renewable energy usage to at least 20%")
        
        if data.get("electricity_usage", 0) > 500:
            recommendations.append("Implement energy efficiency measures to reduce electricity consumption")
        
        recommendations.append("Consider power purchase agreements (PPAs) for renewable energy")
    
    elif prediction_type == "scope3" or prediction_type == "total":
        # Scope 3 recommendations
        if data.get("supply_chain_emissions", 0) > 500:
            recommendations.append("Work with suppliers to reduce their emissions and set targets")
        
        if data.get("business_travel", 0) > 100:
            recommendations.append("Reduce unnecessary business travel and use virtual meetings when possible")
        
        if data.get("employee_commuting", 0) > 200:
            recommendations.append("Encourage carpooling, public transit, or remote work options")
        
        recommendations.append("Develop a comprehensive supply chain emissions tracking system")
    
    # Add some general recommendations
    recommendations.append("Set science-based targets for emissions reduction")
    recommendations.append("Consider carbon offsetting for unavoidable emissions")
    
    # Return a subset of recommendations (maximum 5)
    return recommendations[:5]

@app.get("/")
async def root():
    """Root endpoint that returns API information"""
    return {
        "message": "Carbon Footprint Prediction API",
        "version": MODEL_VERSION,
        "status": "active"
    }

@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: PredictionInput):
    """
    Predict carbon footprint emissions based on input data and prediction type
    """
    try:
        logger.info(f"Received prediction request for type: {input_data.prediction_type}")
        
        # Select the appropriate prediction model based on the prediction type
        if input_data.prediction_type == "scope1":
            prediction, confidence = predict_scope1(input_data.input_data)
        elif input_data.prediction_type == "scope2":
            prediction, confidence = predict_scope2(input_data.input_data)
        elif input_data.prediction_type == "scope3":
            prediction, confidence = predict_scope3(input_data.input_data)
        elif input_data.prediction_type == "total":
            prediction, confidence = predict_total(input_data.input_data)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid prediction_type: {input_data.prediction_type}. Must be one of: scope1, scope2, scope3, total"
            )
        
        # Generate recommendations
        recommendations = generate_recommendations(
            input_data.input_data, 
            input_data.prediction_type,
            prediction
        )
        
        # Create response
        response = PredictionOutput(
            prediction=prediction,
            confidence=confidence,
            model_version=MODEL_VERSION,
            prediction_time=datetime.utcnow(),
            prediction_type=input_data.prediction_type,
            recommendations=recommendations
        )
        
        logger.info(f"Prediction result: {prediction} with confidence: {confidence}")
        return response
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during prediction: {str(e)}"
        )

@app.get("/model-info")
async def model_info():
    """Get information about the prediction models"""
    return {
        "model_version": MODEL_VERSION,
        "models": {
            "scope1": "Direct emissions prediction model v1.0",
            "scope2": "Indirect emissions from energy prediction model v1.0",
            "scope3": "Other indirect emissions prediction model v1.0",
            "total": "Total emissions prediction model v1.0"
        },
        "features": {
            "scope1": ["energy_consumption", "fuel_usage", "num_vehicles", "vehicle_miles"],
            "scope2": ["electricity_usage", "renewable_percentage", "grid_factor"],
            "scope3": ["supply_chain_emissions", "business_travel", "employee_commuting", "waste_disposal"],
            "total": ["All features from other scopes"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Run the API server
    uvicorn.run(app, host="0.0.0.0", port=8000) 