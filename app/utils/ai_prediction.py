import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session

from app import models, schemas

# Configure logging
logger = logging.getLogger(__name__)

# Default AI model configurations
DEFAULT_MODEL_VERSION = "1.0.0"
DEFAULT_MODEL_NAME = "carbon-footprint-predictor"
MODEL_API_URL = os.getenv("MODEL_API_URL", "http://model-service:8000/predict")

class AIPredictionService:
    """Service to handle AI model predictions and interactions"""
    
    @staticmethod
    def predict(
        input_data: Dict[str, Any], 
        prediction_type: str,
        db: Session,
        user_id: int,
        company_id: Optional[int] = None,
    ) -> schemas.AIPredictionResponse:
        """
        Makes a prediction using the AI model and stores the result
        
        Args:
            input_data: Input data for the prediction
            prediction_type: Type of prediction (scope1, scope2, scope3, total)
            db: Database session
            user_id: ID of the user making the prediction
            company_id: Optional ID of the company for which the prediction is made
            
        Returns:
            AIPredictionResponse with prediction results
        """
        try:
            # Convert input data to JSON string
            input_data_str = json.dumps(input_data)
            
            # Call the AI model API
            response = requests.post(
                MODEL_API_URL,
                json={
                    "input_data": input_data,
                    "prediction_type": prediction_type
                },
                headers={"Content-Type": "application/json"}
            )
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract relevant information
            prediction_result = result.get("prediction", 0.0)
            confidence_score = result.get("confidence", None)
            model_version = result.get("model_version", DEFAULT_MODEL_VERSION)
            
            # Create AI prediction record
            ai_prediction = models.AIPrediction(
                company_id=company_id,
                user_id=user_id,
                input_data=input_data_str,
                prediction_result=prediction_result,
                confidence_score=confidence_score,
                model_version=model_version,
                prediction_type=prediction_type
            )
            
            # Save to database
            db.add(ai_prediction)
            db.commit()
            db.refresh(ai_prediction)
            
            # Return the prediction response
            return schemas.AIPredictionResponse(
                id=ai_prediction.id,
                company_id=ai_prediction.company_id,
                user_id=ai_prediction.user_id,
                prediction_result=prediction_result,
                confidence_score=confidence_score,
                model_version=model_version,
                prediction_type=prediction_type,
                prediction_date=ai_prediction.prediction_date,
                created_at=ai_prediction.created_at
            )
            
        except requests.RequestException as e:
            logger.error(f"Error calling AI model API: {str(e)}")
            raise Exception(f"Failed to get prediction from AI model: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error during AI prediction: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    def get_predictions(
        db: Session,
        user_id: Optional[int] = None,
        company_id: Optional[int] = None,
        prediction_type: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[schemas.AIPredictionResponse]:
        """
        Retrieve AI predictions from the database with optional filtering
        
        Args:
            db: Database session
            user_id: Optional filter by user ID
            company_id: Optional filter by company ID
            prediction_type: Optional filter by prediction type
            limit: Maximum number of records to return
            skip: Number of records to skip (for pagination)
            
        Returns:
            List of AIPredictionResponse objects
        """
        query = db.query(models.AIPrediction)
        
        if user_id is not None:
            query = query.filter(models.AIPrediction.user_id == user_id)
            
        if company_id is not None:
            query = query.filter(models.AIPrediction.company_id == company_id)
            
        if prediction_type is not None:
            query = query.filter(models.AIPrediction.prediction_type == prediction_type)
            
        # Order by prediction date (newest first)
        query = query.order_by(models.AIPrediction.prediction_date.desc())
        
        # Apply pagination
        predictions = query.offset(skip).limit(limit).all()
        
        return [
            schemas.AIPredictionResponse(
                id=p.id,
                company_id=p.company_id,
                user_id=p.user_id,
                prediction_result=p.prediction_result,
                confidence_score=p.confidence_score,
                model_version=p.model_version,
                prediction_type=p.prediction_type,
                prediction_date=p.prediction_date,
                created_at=p.created_at
            ) for p in predictions
        ]
    
    @staticmethod
    def get_prediction_by_id(db: Session, prediction_id: int) -> Optional[schemas.AIPredictionResponse]:
        """
        Retrieve a specific AI prediction by ID
        
        Args:
            db: Database session
            prediction_id: ID of the prediction to retrieve
            
        Returns:
            AIPredictionResponse if found, None otherwise
        """
        prediction = db.query(models.AIPrediction).filter(models.AIPrediction.id == prediction_id).first()
        
        if not prediction:
            return None
            
        return schemas.AIPredictionResponse(
            id=prediction.id,
            company_id=prediction.company_id,
            user_id=prediction.user_id,
            prediction_result=prediction.prediction_result,
            confidence_score=prediction.confidence_score,
            model_version=prediction.model_version,
            prediction_type=prediction.prediction_type,
            prediction_date=prediction.prediction_date,
            created_at=prediction.created_at
        )
        
    @staticmethod
    def get_model_metadata(db: Session, model_version: Optional[str] = None) -> List[schemas.AIModelMetadataResponse]:
        """
        Retrieve AI model metadata from the database
        
        Args:
            db: Database session
            model_version: Optional filter by model version
            
        Returns:
            List of AIModelMetadataResponse objects
        """
        query = db.query(models.AIModelMetadata)
        
        if model_version is not None:
            query = query.filter(models.AIModelMetadata.model_version == model_version)
            
        # Order by creation date (newest first)
        query = query.order_by(models.AIModelMetadata.created_at.desc())
        
        metadata_list = query.all()
        
        return [
            schemas.AIModelMetadataResponse(
                id=m.id,
                model_name=m.model_name,
                model_version=m.model_version,
                description=m.description,
                accuracy=m.accuracy,
                training_date=m.training_date,
                parameters=json.loads(m.parameters) if m.parameters else None,
                created_at=m.created_at
            ) for m in metadata_list
        ] 