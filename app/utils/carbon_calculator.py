import requests
import os
import logging
import json
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

CARBON_INTERFACE_API_KEY = os.getenv("CARBON_INTERFACE_API_KEY")
CARBON_INTERFACE_URL = "https://www.carboninterface.com/api/v1/estimates"

def calculate_emission(activity_type: str, params: dict):
    """
    Calculate emissions using Carbon Interface API
    
    Example request:
    {
        "type": "electricity",
        "electricity_unit": "kwh",
        "electricity_value": 100,
        "country": "us",
        "state": "ca"
    }
    """
    if not CARBON_INTERFACE_API_KEY:
        logger.error("CARBON_INTERFACE_API_KEY not found in environment variables")
        return {"error": "API key not configured"}

    headers = {
        "Authorization": f"Bearer {CARBON_INTERFACE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Transform the parameters to Carbon Interface format
    request_data = {
        "type": activity_type,
        "electricity_unit": params.get("energy_unit", "kwh").lower(),
        "electricity_value": float(params.get("energy", 0)),
        "country": params.get("country", "us").lower()
    }
    
    if params.get("state"):
        request_data["state"] = params["state"].lower()
    
    logger.info(f"Making request to Carbon Interface API")
    logger.info(f"Request data: {json.dumps(request_data, indent=2)}")
    
    try:
        response = requests.post(
            CARBON_INTERFACE_URL,
            json=request_data,
            headers=headers
        )
        
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response body: {response.text}")
        
        if response.status_code == 201:  # Carbon Interface uses 201 for successful creation
            data = response.json()
            return {
                "carbon_kg": data.get("data", {}).get("attributes", {}).get("carbon_kg", 0),
                "carbon_lb": data.get("data", {}).get("attributes", {}).get("carbon_lb", 0)
            }
        else:
            error_msg = "Unknown error"
            try:
                error_data = response.json()
                error_msg = error_data.get("message", "Unknown error")
            except:
                error_msg = response.text
                
            logger.error(f"API Error: {error_msg}")
            return {"error": error_msg}
            
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        return {"error": str(e)} 