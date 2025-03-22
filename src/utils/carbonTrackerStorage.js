/**
 * Utilities for storing and retrieving Carbon Tracker data in localStorage
 */

/**
 * Group activities by month and calculate total emissions
 * 
 * @param {Array} activities - Array of carbon tracker activities
 * @returns {Object} - Object with month keys and emission values
 */
export const getMonthlyEmissionsFromActivities = (activities = []) => {
  if (!activities || activities.length === 0) {
    return {};
  }

  const monthlyData = {};
  
  activities.forEach(activity => {
    if (!activity.date || !activity.emissions) return;
    
    const date = new Date(activity.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    
    monthlyData[month] += activity.emissions;
  });
  
  return monthlyData;
};

/**
 * Save carbon tracker activities to localStorage
 * 
 * @param {Array} activities - Array of carbon tracker activities
 * @returns {boolean} - Whether the save was successful
 */
export const saveActivities = (activities) => {
  try {
    localStorage.setItem('carbonTrackerActivities', JSON.stringify(activities));
    
    // Also save monthly data for easy chart access
    const monthlyData = getMonthlyEmissionsFromActivities(activities);
    localStorage.setItem('carbonTrackerMonthlyEmissions', JSON.stringify(monthlyData));
    
    return true;
  } catch (error) {
    console.error('Error saving carbon tracker activities:', error);
    return false;
  }
};

/**
 * Get carbon tracker activities from localStorage
 * 
 * @returns {Array} - Array of carbon tracker activities
 */
export const getActivities = () => {
  try {
    const data = localStorage.getItem('carbonTrackerActivities');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting carbon tracker activities:', error);
    return [];
  }
};

/**
 * Get monthly emissions data for charts from carbon tracker
 * 
 * @returns {Array} - Array of objects with month and value properties
 */
export const getMonthlyEmissionsForChart = () => {
  try {
    const monthlyDataString = localStorage.getItem('carbonTrackerMonthlyEmissions');
    
    if (!monthlyDataString) {
      // Try to build it from activities
      const activities = getActivities();
      if (activities.length === 0) {
        return [];
      }
      
      const monthlyData = getMonthlyEmissionsFromActivities(activities);
      if (Object.keys(monthlyData).length === 0) {
        return [];
      }
      
      // Save for future use
      localStorage.setItem('carbonTrackerMonthlyEmissions', JSON.stringify(monthlyData));
      
      // Format and return
      return formatMonthlyDataForChart(monthlyData);
    }
    
    const monthlyData = JSON.parse(monthlyDataString);
    return formatMonthlyDataForChart(monthlyData);
  } catch (error) {
    console.error('Error getting monthly emissions data:', error);
    return [];
  }
};

/**
 * Format monthly data for chart display
 * 
 * @param {Object} monthlyData - Object with month keys and emission values
 * @returns {Array} - Array of objects with month and value properties
 */
const formatMonthlyDataForChart = (monthlyData) => {
  // Define month order for sorting
  const monthOrder = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  // Convert to array format for charts
  const chartData = Object.entries(monthlyData).map(([month, value]) => ({
    month,
    value,
    sortOrder: monthOrder[month] || 0
  }));
  
  // Sort by month chronologically
  return chartData.sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Get stats for carbon tracker
 * 
 * @returns {Object} - Object with statistics
 */
export const getStats = () => {
  try {
    const activities = getActivities();
    
    if (activities.length === 0) {
      return {
        totalEmissions: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        lastMonth: 0,
        thisMonth: 0,
        trend: 0
      };
    }
    
    const totalEmissions = activities.reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope1 = activities
      .filter(activity => activity.category === 'scope1')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope2 = activities
      .filter(activity => activity.category === 'scope2')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    const scope3 = activities
      .filter(activity => activity.category === 'scope3')
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate this month's emissions
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const thisMonthEmissions = activities
      .filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.getMonth() === thisMonth && activityDate.getFullYear() === thisYear;
      })
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate last month's emissions
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();
    
    const lastMonthEmissions = activities
      .filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.getMonth() === lastMonth && activityDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, activity) => sum + activity.emissions, 0);
    
    // Calculate trend (% change)
    const trend = lastMonthEmissions > 0 
      ? ((thisMonthEmissions - lastMonthEmissions) / lastMonthEmissions) * 100 
      : 0;
    
    return {
      totalEmissions,
      scope1,
      scope2,
      scope3,
      lastMonth: lastMonthEmissions,
      thisMonth: thisMonthEmissions,
      trend
    };
  } catch (error) {
    console.error('Error calculating carbon tracker stats:', error);
    return {
      totalEmissions: 0,
      scope1: 0,
      scope2: 0,
      scope3: 0,
      lastMonth: 0,
      thisMonth: 0,
      trend: 0
    };
  }
}; 