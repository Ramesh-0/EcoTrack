/**
 * Utilities for storing and retrieving emissions data in localStorage
 */

/**
 * Save a new emission calculation to localStorage
 * 
 * @param {Object} calculationData - The emission calculation data to save
 * @param {string} calculationData.category - Category of emission (e.g., 'transport', 'energy')
 * @param {number} calculationData.value - The calculated emissions value in CO2e
 * @param {string} calculationData.date - ISO date string of the calculation
 * @param {string} calculationData.description - Description of the emission entry
 * @returns {boolean} - Whether the save was successful
 */
export const saveEmissionCalculation = (calculationData) => {
  try {
    // Ensure required fields are present
    if (!calculationData.value || !calculationData.date) {
      console.error('Required fields missing from emission calculation data');
      return false;
    }
    
    // Get existing data
    const existingData = getEmissionCalculations();
    
    // Add the new calculation with an ID
    const newCalculation = {
      ...calculationData,
      id: Date.now(),
      date: calculationData.date || new Date().toISOString()
    };
    
    existingData.push(newCalculation);
    
    // Save back to localStorage
    localStorage.setItem('calculatorEmissions', JSON.stringify(existingData));
    
    // Update monthly aggregation
    updateMonthlyEmissions(newCalculation.date, newCalculation.value);
    
    return true;
  } catch (error) {
    console.error('Error saving emission calculation to localStorage:', error);
    return false;
  }
};

/**
 * Get all emission calculations from localStorage
 * 
 * @returns {Array} - Array of emission calculation objects
 */
export const getEmissionCalculations = () => {
  try {
    const data = localStorage.getItem('calculatorEmissions');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading emission calculations from localStorage:', error);
    return [];
  }
};

/**
 * Update monthly emissions aggregation in localStorage
 * 
 * @param {string} dateString - ISO date string
 * @param {number} emissionsValue - Emissions value to add for the month
 */
export const updateMonthlyEmissions = (dateString, emissionsValue) => {
  try {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Get existing monthly data
    const monthlyDataString = localStorage.getItem('supplyChainMonthlyEmissions');
    let monthlyData = {};
    
    if (monthlyDataString) {
      monthlyData = JSON.parse(monthlyDataString);
    }
    
    // Update the emissions for this month
    if (monthlyData[month]) {
      monthlyData[month] += emissionsValue;
    } else {
      monthlyData[month] = emissionsValue;
    }
    
    // Save back to localStorage
    localStorage.setItem('supplyChainMonthlyEmissions', JSON.stringify(monthlyData));
    
  } catch (error) {
    console.error('Error updating monthly emissions in localStorage:', error);
  }
};

/**
 * Get the monthly emissions data in a format suitable for charts
 * 
 * @returns {Array} - Array of objects with month and value properties
 */
export const getMonthlyEmissionsForChart = () => {
  try {
    const monthlyDataString = localStorage.getItem('supplyChainMonthlyEmissions');
    
    if (!monthlyDataString) {
      return [];
    }
    
    const monthlyData = JSON.parse(monthlyDataString);
    
    // Convert to array format for charts and add sort order
    const monthOrder = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const chartData = Object.entries(monthlyData).map(([month, value]) => ({
      month,
      value,
      sortOrder: monthOrder[month] || 0
    }));
    
    // Sort by month chronologically
    return chartData.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error('Error getting monthly emissions data:', error);
    return [];
  }
};

/**
 * Clear all emissions data from localStorage
 */
export const clearEmissionsData = () => {
  try {
    localStorage.removeItem('calculatorEmissions');
    localStorage.removeItem('supplyChainMonthlyEmissions');
    return true;
  } catch (error) {
    console.error('Error clearing emissions data:', error);
    return false;
  }
}; 