from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_
from app import models, schemas, crud
from app.database import get_db, init_db, SessionLocal
from app.auth import (
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user,
    get_current_user
)
from datetime import timedelta, datetime
import logging
import traceback
from typing import List, Optional
import random

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create FastAPI app instance
app = FastAPI(
    title="Carbon Footprint Tracker API",
    description="API for tracking and managing carbon footprint data",
    version="1.0.0",
    debug=True
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

logger.debug("Registering routes...")

@app.on_event("startup")
async def startup_event():
    try:
        # Initialize database
        init_db()
        
        # Create test data if needed
        db = SessionLocal()
        try:
            # Check if we have any data
            result = db.execute(text("SELECT COUNT(*) FROM emissions_data")).scalar()
            if result == 0:
                # Create a test user if none exists
                test_user = db.query(models.User).filter(models.User.email == "test@example.com").first()
                if not test_user:
                    test_user = models.User(
                        username="testuser",
                        email="test@example.com",
                        is_active=True
                    )
                    test_user.set_password("testpassword")
                    db.add(test_user)
                    db.commit()
                    db.refresh(test_user)
                
                # Generate test data for the last 30 days
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)
                
                # Emission types and their CO2 factors
                emission_types = [
                    {"type": "electricity", "co2_per_unit": 0.5, "unit": "kWh"},
                    {"type": "natural_gas", "co2_per_unit": 2.1, "unit": "m³"},
                    {"type": "water", "co2_per_unit": 0.344, "unit": "m³"},
                    {"type": "waste", "co2_per_unit": 0.5, "unit": "kg"},
                    {"type": "transportation", "co2_per_unit": 0.2, "unit": "km"}
                ]
                
                # Generate daily data
                current_date = start_date
                while current_date <= end_date:
                    for emission_type in emission_types:
                        # Generate random amount
                        amount = random.uniform(1, 100)
                        
                        # Create emissions data entry
                        emissions_data = models.EmissionData(
                            user_id=test_user.id,
                            date=current_date,
                            type=emission_type["type"],
                            amount=amount,
                            co2_per_unit=emission_type["co2_per_unit"],
                            unit=emission_type["unit"],
                            description=f"Test data for {emission_type['type']}"
                        )
                        db.add(emissions_data)
                    
                    current_date += timedelta(days=1)
                
                db.commit()
                logger.info("Test data created successfully")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        # Don't raise the error, just log it
        # This allows the application to start even if there are database issues

@app.get("/")
def root():
    logger.debug("Root endpoint called")
    return {"message": "Welcome to the AI Carbon Footprint Tracker API!"}

@app.get("/test")
def test_endpoint():
    logger.debug("Test endpoint called")
    return {"message": "API is working!"}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    logger.debug("Test DB endpoint called")
    try:
        # Test the database connection
        db.execute(text("SELECT 1"))
        return {"message": "Database connection successful!", "test_value": 1}
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.post("/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    logger.debug(f"Signup endpoint called with username: {user.username}")
    try:
        # Check if user already exists
        db_user = db.query(models.User).filter(
            (models.User.email == user.email) | 
            (models.User.username == user.username)
        ).first()
        
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email or username already registered"
            )
        
        # Check if passwords match
        if user.password != user.confirm_password:
            raise HTTPException(
                status_code=400,
                detail="Passwords do not match"
            )
        
        # Create new user
        new_user = models.User(
            username=user.username,
            email=user.email,
            is_active=True,
            is_superuser=False
        )
        new_user.set_password(user.password)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User created successfully: {new_user.username}")
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at,
            "company_id": new_user.company_id
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}\n{traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )

@app.post("/auth/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        user = await authenticate_user(db, user_credentials.email, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "company_id": user.company_id,
                "created_at": user.created_at
            },
            "redirect_url": "/dashboard"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in login: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during login: {str(e)}"
        )

@app.get("/dashboard", response_model=schemas.DashboardResponse)
async def get_dashboard(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get the dashboard data for the authenticated user.
    This endpoint requires authentication.
    """
    logger.debug(f"Dashboard endpoint called by user: {current_user.username}")
    try:
        # Get user's emissions data
        emissions_data = db.query(models.EmissionData).filter(
            models.EmissionData.user_id == current_user.id
        ).all()
        
        # Get user's company data if they belong to one
        company_data = None
        if current_user.company_id:
            company_data = db.query(models.Company).filter(
                models.Company.id == current_user.company_id
            ).first()

        # Calculate monthly data
        monthly_data = []
        total_emissions = 0
        total_companies = 1  # Current company
        total_suppliers = db.query(models.Supplier).count()

        if emissions_data:
            # Group emissions by month
            emissions_by_month = {}
            for emission in emissions_data:
                month_key = emission.date.strftime("%b")  # Get month abbreviation
                if month_key not in emissions_by_month:
                    emissions_by_month[month_key] = 0
                emissions_by_month[month_key] += emission.amount
                total_emissions += emission.amount

            # Convert to list format for frontend
            monthly_data = [
                {"month": month, "emissions": amount}
                for month, amount in emissions_by_month.items()
            ]
            
        return {
            "user": current_user,
            "emissions_data": emissions_data,
            "company_data": company_data,
            "total_emissions": total_emissions,
            "total_companies": total_companies,
            "total_suppliers": total_suppliers,
            "monthlyData": monthly_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dashboard data: {str(e)}"
        )

@app.get("/suppliers", response_model=List[schemas.SupplierResponse])
async def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Fetching suppliers for user: {current_user.username}")
        suppliers = crud.get_suppliers(db, skip=skip, limit=limit)
        return suppliers
    except Exception as e:
        logger.error(f"Error fetching suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/suppliers", response_model=schemas.SupplierResponse)
async def create_supplier(
    supplier: schemas.SupplierCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Creating supplier: {supplier.name}")
        db_supplier = crud.create_supplier(db=db, supplier=supplier)
        logger.info(f"Supplier created successfully: {db_supplier.name}")
        return db_supplier
    except ValueError as e:
        logger.warning(f"Validation error while creating supplier: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-data")
async def create_test_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Clear existing test data for this user
        db.query(models.EmissionData).filter(models.EmissionData.user_id == current_user.id).delete()
        
        # Generate test data for the last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Emission types and their CO2 factors
        emission_types = [
            {"type": "electricity", "co2_per_unit": 0.5, "unit": "kWh"},
            {"type": "natural_gas", "co2_per_unit": 2.1, "unit": "m³"},
            {"type": "water", "co2_per_unit": 0.344, "unit": "m³"},
            {"type": "waste", "co2_per_unit": 0.5, "unit": "kg"},
            {"type": "transportation", "co2_per_unit": 0.2, "unit": "km"}
        ]
        
        # Generate daily data
        current_date = start_date
        while current_date <= end_date:
            for emission_type in emission_types:
                # Generate random amount
                amount = random.uniform(1, 100)
                
                # Create emissions data entry
                emissions_data = models.EmissionData(
                    user_id=current_user.id,
                    date=current_date,
                    type=emission_type["type"],
                    amount=amount,
                    co2_per_unit=emission_type["co2_per_unit"],
                    unit=emission_type["unit"],
                    description=f"Test data for {emission_type['type']}"
                )
                db.add(emissions_data)
            
            current_date += timedelta(days=1)
        
        db.commit()
        return {"message": "Test data created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating test data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create test data")

@app.post("/supply-chain", response_model=schemas.SupplyChainResponse)
async def create_supply_chain_data(
    supply_chain: schemas.SupplyChainCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create new supply chain data entry.
    This endpoint requires authentication.
    """
    logger.debug(f"Supply chain data submission by user: {current_user.username}")
    try:
        return crud.create_supply_chain(db=db, supply_chain=supply_chain, user_id=current_user.id)
    except Exception as e:
        logger.error(f"Error creating supply chain data: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating supply chain data: {str(e)}"
        )

@app.get("/supply-chain", response_model=List[schemas.SupplyChainResponse])
async def get_supply_chains(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's supply chain data entries.
    This endpoint requires authentication.
    """
    logger.debug(f"Fetching supply chain data for user: {current_user.username}")
    try:
        return crud.get_user_supply_chains(db=db, user_id=current_user.id, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Error fetching supply chain data: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching supply chain data: {str(e)}"
        )

@app.get("/supply-chain/{supply_chain_id}", response_model=schemas.SupplyChainResponse)
async def get_supply_chain(
    supply_chain_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific supply chain data entry.
    This endpoint requires authentication.
    """
    logger.debug(f"Fetching supply chain {supply_chain_id} for user: {current_user.username}")
    try:
        supply_chain = crud.get_supply_chain(db=db, supply_chain_id=supply_chain_id, user_id=current_user.id)
        if supply_chain is None:
            raise HTTPException(status_code=404, detail="Supply chain not found")
        return supply_chain
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching supply chain: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching supply chain: {str(e)}"
        )

@app.delete("/supply-chain/{supply_chain_id}")
async def delete_supply_chain(
    supply_chain_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete supply chain data entry.
    This endpoint requires authentication.
    """
    logger.debug(f"Deleting supply chain {supply_chain_id} for user: {current_user.username}")
    try:
        if crud.delete_supply_chain(db=db, supply_chain_id=supply_chain_id, user_id=current_user.id):
            return {"message": "Supply chain deleted successfully"}
        raise HTTPException(status_code=404, detail="Supply chain not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting supply chain: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting supply chain: {str(e)}"
        )

@app.get("/emissions/analytics", response_model=schemas.EmissionsAnalyticsResponse)
async def get_emissions_analytics(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    timeframe: str = Query("month", description="Timeframe for aggregation (day/week/month)"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Convert string dates to datetime objects
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        # Get emissions data for the date range
        emissions_query = db.query(models.EmissionData).filter(
            and_(
                models.EmissionData.user_id == current_user.id,
                models.EmissionData.date >= start,
                models.EmissionData.date <= end
            )
        )

        # Calculate total emissions
        total_emissions = db.query(func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit)).filter(
            and_(
                models.EmissionData.user_id == current_user.id,
                models.EmissionData.date >= start,
                models.EmissionData.date <= end
            )
        ).scalar() or 0

        # Calculate previous period for comparison
        period_length = end - start
        previous_start = start - period_length
        previous_end = start - timedelta(days=1)

        previous_emissions = db.query(func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit)).filter(
            and_(
                models.EmissionData.user_id == current_user.id,
                models.EmissionData.date >= previous_start,
                models.EmissionData.date <= previous_end
            )
        ).scalar() or 0

        # Calculate change percentage
        change_percentage = ((total_emissions - previous_emissions) / previous_emissions * 100) if previous_emissions > 0 else 0

        # Calculate average daily emissions
        days = (end - start).days + 1
        average_emissions = total_emissions / days if days > 0 else 0

        # Get emissions by type
        emissions_by_type = db.query(
            models.EmissionData.type,
            func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit).label('emissions')
        ).filter(
            and_(
                models.EmissionData.user_id == current_user.id,
                models.EmissionData.date >= start,
                models.EmissionData.date <= end
            )
        ).group_by(models.EmissionData.type).all()

        # Get emissions trend based on timeframe
        if timeframe == "day":
            trend_data = db.query(
                func.date(models.EmissionData.date).label('date'),
                func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit).label('emissions')
            ).filter(
                and_(
                    models.EmissionData.user_id == current_user.id,
                    models.EmissionData.date >= start,
                    models.EmissionData.date <= end
                )
            ).group_by(func.date(models.EmissionData.date)).all()
        elif timeframe == "week":
            trend_data = db.query(
                func.date_trunc('week', models.EmissionData.date).label('date'),
                func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit).label('emissions')
            ).filter(
                and_(
                    models.EmissionData.user_id == current_user.id,
                    models.EmissionData.date >= start,
                    models.EmissionData.date <= end
                )
            ).group_by(func.date_trunc('week', models.EmissionData.date)).all()
        else:  # month
            trend_data = db.query(
                func.date_trunc('month', models.EmissionData.date).label('date'),
                func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit).label('emissions')
            ).filter(
                and_(
                    models.EmissionData.user_id == current_user.id,
                    models.EmissionData.date >= start,
                    models.EmissionData.date <= end
                )
            ).group_by(func.date_trunc('month', models.EmissionData.date)).all()

        # Get monthly comparison
        monthly_comparison = []
        current_month = start.replace(day=1)
        while current_month <= end:
            month_end = (current_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            current_month_emissions = db.query(
                func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit)
            ).filter(
                and_(
                    models.EmissionData.user_id == current_user.id,
                    models.EmissionData.date >= current_month,
                    models.EmissionData.date <= month_end
                )
            ).scalar() or 0

            previous_month = current_month - timedelta(days=32)
            previous_month_end = current_month - timedelta(days=1)
            previous_month_emissions = db.query(
                func.sum(models.EmissionData.amount * models.EmissionData.co2_per_unit)
            ).filter(
                and_(
                    models.EmissionData.user_id == current_user.id,
                    models.EmissionData.date >= previous_month,
                    models.EmissionData.date <= previous_month_end
                )
            ).scalar() or 0

            monthly_comparison.append({
                "month": current_month.strftime("%Y-%m"),
                "current": current_month_emissions,
                "previous": previous_month_emissions
            })

            current_month = (current_month + timedelta(days=32)).replace(day=1)

        return {
            "statistics": {
                "totalEmissions": total_emissions,
                "changePercentage": change_percentage,
                "averageEmissions": average_emissions
            },
            "byType": [
                {"type": item.type, "emissions": item.emissions}
                for item in emissions_by_type
            ],
            "trend": [
                {"date": item.date.strftime("%Y-%m-%d"), "emissions": item.emissions}
                for item in trend_data
            ],
            "monthlyComparison": monthly_comparison
        }

    except Exception as e:
        logger.error(f"Error calculating emissions analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate emissions analytics")

# Print all registered routes after they are defined
logger.debug("Final registered routes:")
for route in app.routes:
    logger.debug(f"Route: {route.path}, Methods: {route.methods}")

logger.debug("Routes registered successfully")
