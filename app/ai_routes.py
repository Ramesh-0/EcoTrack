from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.auth import get_current_active_user
from app.utils.ai_prediction import AIPredictionService

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Predictions"],
    responses={404: {"description": "Not found"}},
)

@router.post("/predict", response_model=schemas.AIPredictionResponse)
async def create_prediction(
    prediction_input: schemas.AIPredictionInput,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Create a new AI prediction using the provided input data.
    The prediction will be associated with the current user and optionally a company.
    """
    try:
        # Create prediction
        prediction = AIPredictionService.predict(
            input_data=prediction_input.input_data,
            prediction_type=prediction_input.prediction_type,
            db=db,
            user_id=current_user.id,
            company_id=prediction_input.company_id,
        )
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create prediction: {str(e)}",
        )

@router.get("/predictions", response_model=List[schemas.AIPredictionResponse])
async def get_predictions(
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    prediction_type: Optional[str] = Query(None, description="Filter by prediction type"),
    limit: int = Query(100, le=500, description="Maximum number of predictions to return"),
    skip: int = Query(0, ge=0, description="Number of predictions to skip"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Get a list of AI predictions with optional filtering.
    Regular users can only see their own predictions, while admins can see all predictions.
    """
    # Check if the user is an admin
    is_admin = current_user.role == "admin"
    
    # If not admin, force user_id filter to current user
    user_id = None if is_admin else current_user.id
    
    predictions = AIPredictionService.get_predictions(
        db=db,
        user_id=user_id,
        company_id=company_id,
        prediction_type=prediction_type,
        limit=limit,
        skip=skip,
    )
    
    return predictions

@router.get("/predictions/{prediction_id}", response_model=schemas.AIPredictionResponse)
async def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Get a specific AI prediction by ID.
    Regular users can only access their own predictions, while admins can access all predictions.
    """
    prediction = AIPredictionService.get_prediction_by_id(db=db, prediction_id=prediction_id)
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID {prediction_id} not found",
        )
    
    # Check if the user is authorized to access this prediction
    is_admin = current_user.role == "admin"
    is_owner = prediction.user_id == current_user.id
    
    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this prediction",
        )
    
    return prediction

@router.get("/model-metadata", response_model=List[schemas.AIModelMetadataResponse])
async def get_model_metadata(
    model_version: Optional[str] = Query(None, description="Filter by model version"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(get_current_active_user),
):
    """
    Get a list of AI model metadata.
    This is primarily for informational purposes to track model versions and training details.
    """
    metadata_list = AIPredictionService.get_model_metadata(db=db, model_version=model_version)
    return metadata_list 