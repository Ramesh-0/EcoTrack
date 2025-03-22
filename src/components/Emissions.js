import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Emissions.css';
import emissionsService from '../services/emissionsService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Emissions = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [formData, setFormData] = useState({
    calculationType: 'electricity',
    amount: 100,
    unit: 'kWh',
    country: 'US',
    vehicleType: 'car-petrol',
    notes: ''
  });

  // Fetch saved calculations from database on component mount
  useEffect(() => {
    fetchSavedCalculations();
  }, []);

  const fetchSavedCalculations = async () => {
    try {
      setFetchingData(true);
      const data = await emissionsService.getSavedCalculations();
      setSavedCalculations(data || []);
      setFetchingData(false);
    } catch (error) {
      console.error('Error fetching saved calculations:', error);
      if (error.message === 'Authentication required') {
        // Optional: redirect to login
        // window.location.href = '/login';
      }
      setFetchingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setCalculationResult(null);
  };

  const handleCalculationTypeChange = (e) => {
    const calculationType = e.target.value;
    let unit = formData.unit;
    
    // Set appropriate default units based on calculation type
    if (calculationType === 'electricity') {
      unit = 'kWh';
    } else if (calculationType === 'water') {
      unit = 'm³';
    } else if (calculationType === 'waste') {
      unit = 'kg';
    } else if (calculationType === 'transportation') {
      unit = 'km';
    }
    
    setFormData({
      ...formData,
      calculationType,
      unit
    });
    setCalculationResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use the emissions service to calculate emissions
      const result = await emissionsService.calculateEmissions(formData);
      setCalculationResult(result);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating emissions:', error);
      setLoading(false);
      alert('Error calculating emissions. Please try again later.');
    }
  };

  const saveCalculation = async () => {
    if (!calculationResult) return;
    
    try {
      setLoading(true);
      
      const calculationData = {
        calculationType: formData.calculationType,
        input: {
          amount: formData.amount,
          unit: formData.unit,
          ...(formData.calculationType === 'electricity' && { country: formData.country }),
          ...(formData.calculationType === 'transportation' && { vehicleType: formData.vehicleType }),
          ...(formData.notes && { notes: formData.notes })
        },
        result: calculationResult
      };
      
      const savedCalculation = await emissionsService.saveCalculation(calculationData);
      
      // Add the new calculation to the state
      setSavedCalculations([savedCalculation, ...savedCalculations]);
      setLoading(false);
      alert('Calculation saved successfully!');
    } catch (error) {
      console.error('Error saving calculation:', error);
      setLoading(false);
      
      if (error.message === 'Authentication required') {
        alert('You must be logged in to save calculations');
        // Optional: redirect to login
        // window.location.href = '/login';
      } else {
        alert('Error saving calculation. Please try again later.');
      }
    }
  };

  const deleteCalculation = async (id) => {
    try {
      setLoading(true);
      
      await emissionsService.deleteCalculation(id);
      
      // Update state after successful deletion
      const updatedCalculations = savedCalculations.filter(calc => calc._id !== id);
      setSavedCalculations(updatedCalculations);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting calculation:', error);
      setLoading(false);
      
      if (error.message === 'Authentication required') {
        alert('You must be logged in to delete calculations');
        // Optional: redirect to login
        // window.location.href = '/login';
      } else {
        alert('Error deleting calculation. Please try again later.');
      }
    }
  };

  // Helper function to format calculation type for display
  const formatCalculationType = (type) => {
    switch(type) {
      case 'electricity': return 'Electricity';
      case 'transportation': return 'Transportation';
      case 'water': return 'Water Usage';
      case 'waste': return 'Waste Disposal';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Helper function to format vehicle type for display
  const formatVehicleType = (type) => {
    switch(type) {
      case 'car-petrol': return 'Car (Petrol/Gasoline)';
      case 'car-diesel': return 'Car (Diesel)';
      case 'car-electric': return 'Car (Electric)';
      case 'bus': return 'Bus / Coach';
      case 'train': return 'Train / Rail';
      case 'plane': return 'Airplane';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="emissions-container">
      <h1 className="page-title">Carbon Emissions Calculator</h1>
      
      <div className="calculator-container">
        <div className="tabs">
          <button 
            className={`tab ${!showSaved ? 'active' : ''}`} 
            onClick={() => setShowSaved(false)}
          >
            Calculator
          </button>
          <button 
            className={`tab ${showSaved ? 'active' : ''}`} 
            onClick={() => setShowSaved(true)}
          >
            Saved Calculations ({savedCalculations.length})
          </button>
        </div>

        {!showSaved ? (
          // Calculator View
          <>
            <div className="card">
              <h3 className="card-title">Calculate Your Carbon Footprint</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>What would you like to calculate?</label>
                  <select 
                    name="calculationType" 
                    value={formData.calculationType}
                    onChange={handleCalculationTypeChange}
                    className="form-control"
                  >
                    <option value="electricity">Electricity Consumption</option>
                    <option value="transportation">Transportation</option>
                    <option value="water">Water Usage</option>
                    <option value="waste">Waste Disposal</option>
                  </select>
                </div>
                
                {formData.calculationType === 'transportation' && (
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select 
                      name="vehicleType" 
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="car-petrol">Car (Petrol/Gasoline)</option>
                      <option value="car-diesel">Car (Diesel)</option>
                      <option value="car-electric">Car (Electric)</option>
                      <option value="bus">Bus / Coach</option>
                      <option value="train">Train / Rail</option>
                      <option value="plane">Airplane</option>
                    </select>
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group quantity">
                    <label>Quantity</label>
                    <input 
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="0.01"
                      step="0.01"
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group unit">
                    <label>Unit</label>
                    <select 
                      name="unit" 
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      {formData.calculationType === 'electricity' && (
                        <>
                          <option value="kWh">kWh</option>
                          <option value="MWh">MWh</option>
                        </>
                      )}
                      
                      {formData.calculationType === 'water' && (
                        <>
                          <option value="m³">m³</option>
                          <option value="L">Liters</option>
                          <option value="gal">Gallons</option>
                        </>
                      )}
                      
                      {formData.calculationType === 'waste' && (
                        <>
                          <option value="kg">kg</option>
                          <option value="tonnes">Tonnes</option>
                          <option value="lb">Pounds</option>
                        </>
                      )}
                      
                      {formData.calculationType === 'transportation' && (
                        <>
                          <option value="km">km</option>
                          <option value="miles">Miles</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                
                {formData.calculationType === 'electricity' && (
                  <div className="form-group">
                    <label>Country</label>
                    <select 
                      name="country" 
                      value={formData.country}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="IN">India</option>
                      <option value="CN">China</option>
                      <option value="AU">Australia</option>
                    </select>
                    <small className="form-text">Different countries have different carbon intensities for electricity production.</small>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="form-control"
                    placeholder="Additional notes..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="calculate-btn"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Carbon Emissions'}
                </button>
              </form>
            </div>
            
            {calculationResult && (
              <div className="card result-card">
                <h3 className="card-title">Calculation Results</h3>
                
                <div className="result-content">
                  <div className="result-value">
                    <span className="value">{calculationResult.co2e}</span>
                    <span className="unit">{calculationResult.unit}</span>
                  </div>
                  
                  <div className="result-details">
                    <div className="result-item">
                      <span className="result-label">Calculation:</span>
                      <span className="result-text">{calculationResult.calculation}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Source:</span>
                      <span className="result-text">{calculationResult.source}</span>
                    </div>
                  </div>
                  
                  <div className="result-note">
                    <p>Note: These calculations are approximations based on average emission factors. For more precise calculations, please consult with a sustainability expert.</p>
                  </div>
                  
                  <div className="result-actions">
                    <button 
                      onClick={saveCalculation} 
                      className="save-btn"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save This Calculation'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Saved Calculations View
          <div className="card saved-calculations">
            <h3 className="card-title">Your Saved Calculations</h3>
            
            {fetchingData ? (
              <div className="loading-spinner">Loading your saved calculations...</div>
            ) : savedCalculations.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any saved calculations yet.</p>
                <button onClick={() => setShowSaved(false)} className="action-btn">
                  Get Started
                </button>
              </div>
            ) : (
              <div className="saved-list">
                {savedCalculations.map(calculation => (
                  <div key={calculation._id} className="saved-item">
                    <div className="saved-header">
                      <div className="saved-type">
                        {formatCalculationType(calculation.calculationType)}
                        <span className="saved-date">
                          {new Date(calculation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteCalculation(calculation._id)} 
                        className="delete-btn"
                        aria-label="Delete calculation"
                        disabled={loading}
                      >
                        {loading ? '•' : '×'}
                      </button>
                    </div>
                    
                    <div className="saved-details">
                      <div className="saved-inputs">
                        <div className="saved-input-item">
                          <span className="saved-input-label">Amount:</span>
                          <span className="saved-input-value">
                            {calculation.input.amount} {calculation.input.unit}
                          </span>
                        </div>
                        
                        {calculation.calculationType === 'electricity' && calculation.input.country && (
                          <div className="saved-input-item">
                            <span className="saved-input-label">Country:</span>
                            <span className="saved-input-value">{calculation.input.country}</span>
                          </div>
                        )}
                        
                        {calculation.calculationType === 'transportation' && calculation.input.vehicleType && (
                          <div className="saved-input-item">
                            <span className="saved-input-label">Vehicle:</span>
                            <span className="saved-input-value">
                              {formatVehicleType(calculation.input.vehicleType)}
                            </span>
                          </div>
                        )}
                        
                        {calculation.input.notes && (
                          <div className="saved-input-item">
                            <span className="saved-input-label">Notes:</span>
                            <span className="saved-input-value">{calculation.input.notes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="saved-result">
                        <span className="saved-result-value">{calculation.result.co2e}</span>
                        <span className="saved-result-unit">{calculation.result.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Emissions;