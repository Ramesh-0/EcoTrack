from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
from datetime import datetime, date
from enum import Enum, auto

# Enum definitions
class TransportationType(str, Enum):
    ROAD = "road"
    RAIL = "rail"
    AIR = "air"
    SEA = "sea"
    
class MaterialType(str, Enum):
    RAW_MATERIALS = "raw_materials"
    PROCESSED_MATERIALS = "processed_materials"
    COMPONENTS = "components"
    PACKAGING = "packaging"
    FINISHED_GOODS = "finished_goods"

# Company Schema
class CompanyBase(BaseModel):
    name: str = Field(..., example="GreenTech Ltd")
    industry: str = Field(..., example="Technology")
    region: str = Field(..., example="North America")
    carbon_footprint: float = Field(..., ge=0, example=123.45)

    @validator('carbon_footprint')
    def validate_carbon_footprint(cls, v):
        if v < 0:
            raise ValueError('Carbon footprint cannot be negative')
        return v

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Supplier Schema
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, example="EcoSupplies")
    emission_ratings: float = Field(..., ge=0, le=100, description="Emission rating from 0-100")
    location: str = Field(..., min_length=1, example="Europe")
    description: str | None = Field(default=None, example="A sustainable supplier")

    @validator('emission_ratings')
    def validate_emission_ratings(cls, v):
        try:
            v = float(v)
            if not 0 <= v <= 100:
                raise ValueError('Emission ratings must be between 0 and 100')
            return round(v, 2)  # Round to 2 decimal places
        except (TypeError, ValueError):
            raise ValueError('Invalid emission rating value')

    @validator('name', 'location')
    def validate_string_fields(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or just whitespace')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if v is None:
            return None
        v = v.strip()
        return v if v else None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Emissions Data Schema
class EmissionsDataBase(BaseModel):
    date: date
    type: str
    amount: float
    co2_per_unit: float
    unit: str
    description: Optional[str] = None

class EmissionsDataCreate(EmissionsDataBase):
    pass

class EmissionsData(EmissionsDataBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class EmissionsDataResponse(EmissionsDataBase):
    id: int
    company: CompanyResponse
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    confirm_password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    confirm_new_password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    company_id: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    redirect_url: str

    class Config:
        from_attributes = True

class TokenData(BaseModel):
    email: Optional[str] = None

class EmissionBase(BaseModel):
    company_id: int
    supplier_id: int
    emission_amount: float
    emission_date: datetime

class EmissionCreate(EmissionBase):
    pass

class EmissionUpdate(EmissionBase):
    pass

class EmissionResponse(EmissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EmissionDataResponse(BaseModel):
    id: int
    amount: float
    type: str
    date: datetime
    user_id: int

    class Config:
        from_attributes = True

class MonthlyData(BaseModel):
    month: str
    emissions: float

class DashboardResponse(BaseModel):
    user: UserResponse
    emissions_data: List[EmissionDataResponse] = []
    company_data: Optional[CompanyResponse] = None
    total_emissions: float
    total_companies: int
    total_suppliers: int
    monthlyData: List[MonthlyData] = []

    class Config:
        from_attributes = True

class MaterialBase(BaseModel):
    material_type: MaterialType
    quantity: float = Field(..., ge=0)
    transportation_type: TransportationType
    transportation_distance: float = Field(..., ge=0)
    transportation_date: datetime
    notes: Optional[str] = None

    @validator('quantity')
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError('Quantity cannot be negative')
        return v

    @validator('transportation_distance')
    def validate_distance(cls, v):
        if v < 0:
            raise ValueError('Transportation distance cannot be negative')
        return v

class MaterialCreate(MaterialBase):
    pass

class MaterialResponse(MaterialBase):
    id: int
    created_at: datetime
    supply_chain_id: int

    class Config:
        from_attributes = True

class SupplyChainBase(BaseModel):
    supplier_name: str = Field(..., min_length=1)
    date: datetime
    materials: List[MaterialBase]

class SupplyChainCreate(SupplyChainBase):
    pass

class SupplyChainResponse(SupplyChainBase):
    id: int
    created_at: datetime
    user_id: int
    materials: List[MaterialResponse]

    class Config:
        from_attributes = True

class EmissionsAnalyticsResponse(BaseModel):
    statistics: dict
    byType: List[dict]
    trend: List[dict]
    monthlyComparison: List[dict]

# AI Supplier Emission Prediction Schemas
class SupplierEmissionPredictionRequest(BaseModel):
    supplierEmissions: float = Field(..., ge=0, description="Base supplier emissions in tCO2e")
    transportDistance: float = Field(..., ge=0, description="Transport distance in kilometers")
    industryType: str = Field(..., description="Type of industry")

    @validator('supplierEmissions', 'transportDistance')
    def validate_non_negative(cls, v):
        if v < 0:
            raise ValueError('Value cannot be negative')
        return v

class EmissionComponent(BaseModel):
    baseEmissions: float
    transportEmissions: float
    industryFactor: float

class SupplierEmissionPredictionResponse(BaseModel):
    predictedEmissions: float
    confidenceLevel: float
    emissionComponents: EmissionComponent
    reductionPotential: float
    recommendations: List[str]

# AI Prediction Schemas
class AIPredictionInput(BaseModel):
    company_id: Optional[int] = None
    input_data: dict
    prediction_type: str = Field(..., description="Type of prediction (scope1, scope2, scope3, total)")

class AIPredictionCreate(AIPredictionInput):
    user_id: int

class AIPredictionResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    user_id: int
    prediction_result: float
    confidence_score: Optional[float] = None
    model_version: Optional[str] = None
    prediction_type: str
    prediction_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class AIModelMetadataBase(BaseModel):
    model_name: str
    model_version: str
    description: Optional[str] = None
    accuracy: Optional[float] = None
    training_date: Optional[datetime] = None
    parameters: Optional[dict] = None

class AIModelMetadataCreate(AIModelMetadataBase):
    pass

class AIModelMetadataResponse(AIModelMetadataBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
