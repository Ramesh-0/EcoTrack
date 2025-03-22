import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Emissions service to handle API requests for emissions data
 */
class EmissionsService {
  /**
   * Get all saved emissions calculations for the current user
   * @returns {Promise<Array>} List of saved emission calculations
   */
  async getSavedCalculations() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/emissions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
  
  /**
   * Save a new emission calculation
   * @param {Object} calculationData - The calculation data to save
   * @returns {Promise<Object>} The saved calculation
   */
  async saveCalculation(calculationData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/emissions`, calculationData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  /**
   * Delete a saved emission calculation
   * @param {string} id - The ID of the calculation to delete
   * @returns {Promise<void>}
   */
  async deleteCalculation(id) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    await axios.delete(`${API_URL}/emissions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  /**
   * Calculate emissions (simulated for now, would be replaced with real API call)
   * @param {Object} formData - Form data with calculation parameters
   * @returns {Promise<Object>} The calculation result
   */
  calculateEmissions(formData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const amount = parseFloat(formData.amount);
          let result;
          
          switch(formData.calculationType) {
            case 'electricity':
              // Emission factors vary by country
              let electricityFactor = 0.42; // Default US factor
              if (formData.country === 'FR') electricityFactor = 0.06; // France has low carbon electricity
              if (formData.country === 'CN') electricityFactor = 0.61; // China has higher carbon electricity
              
              result = {
                co2e: (amount * electricityFactor).toFixed(2),
                unit: 'kgCO₂e',
                calculation: `${amount} ${formData.unit} × ${electricityFactor} kg CO₂e per ${formData.unit}`,
                source: 'Carbon Footprint API'
              };
              break;
              
            case 'transportation':
              let factor = 0.16; // Default for car-petrol in km
              if (formData.vehicleType === 'car-electric') factor = 0.05;
              if (formData.vehicleType === 'car-diesel') factor = 0.18;
              if (formData.vehicleType === 'bus') factor = 0.1;
              if (formData.vehicleType === 'train') factor = 0.06;
              if (formData.vehicleType === 'plane') factor = 0.25;
              if (formData.unit === 'miles') factor *= 1.60934; // Convert miles to km
              
              result = {
                co2e: (amount * factor).toFixed(2),
                unit: 'kgCO₂e',
                calculation: `${amount} ${formData.unit} × ${factor} kg CO₂e per ${formData.unit}`,
                source: 'Carbon Footprint API'
              };
              break;
              
            case 'water':
              result = {
                co2e: (amount * 0.001).toFixed(3),
                unit: 'kgCO₂e',
                calculation: `${amount} ${formData.unit} × 0.001 kg CO₂e per ${formData.unit}`,
                source: 'Carbon Footprint API'
              };
              break;
              
            case 'waste':
              result = {
                co2e: (amount * 0.56).toFixed(2),
                unit: 'kgCO₂e',
                calculation: `${amount} ${formData.unit} × 0.56 kg CO₂e per ${formData.unit}`,
                source: 'Carbon Footprint API'
              };
              break;
              
            default:
              result = {
                co2e: (amount * 0.1).toFixed(2),
                unit: 'kgCO₂e',
                calculation: 'Default calculation method',
                source: 'Carbon Footprint API'
              };
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 1000); // Simulate API delay
    });
  }
}

// Create a singleton instance
const emissionsService = new EmissionsService();

export default emissionsService; 