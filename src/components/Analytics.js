import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Alert } from 'antd';

const COLORS = ['#00ff00', '#00cc00', '#009900', '#006600', '#003300'];

// Mock data for when API fails
const mockEmissionsData = {
  statistics: {
    totalEmissions: 15240,
    changePercentage: -12.5,
    averageEmissions: 520
  },
  trend: [
    { date: 'Jan', emissions: 1250 },
    { date: 'Feb', emissions: 1180 },
    { date: 'Mar', emissions: 1320 },
    { date: 'Apr', emissions: 1400 },
    { date: 'May', emissions: 1370 },
    { date: 'Jun', emissions: 1280 },
    { date: 'Jul', emissions: 1350 },
    { date: 'Aug', emissions: 1330 },
    { date: 'Sep', emissions: 1290 },
    { date: 'Oct', emissions: 1220 },
    { date: 'Nov', emissions: 1150 },
    { date: 'Dec', emissions: 1100 }
  ],
  byType: [
    { type: 'Electricity', emissions: 5240 },
    { type: 'Transportation', emissions: 4320 },
    { type: 'Manufacturing', emissions: 3180 },
    { type: 'Heating', emissions: 2500 }
  ],
  monthlyComparison: [
    { month: 'Jan', current: 1250, previous: 1350 },
    { month: 'Feb', current: 1180, previous: 1280 },
    { month: 'Mar', current: 1320, previous: 1420 },
    { month: 'Apr', current: 1400, previous: 1500 },
    { month: 'May', current: 1370, previous: 1470 },
    { month: 'Jun', current: 1280, previous: 1380 }
  ]
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emissionsData, setEmissionsData] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    statistics: true,
    trend: true,
    byType: true,
    monthlyComparison: true
  });

  const [predictionParams, setPredictionParams] = useState({
    timeframe: 'monthly',
    duration: 12,
    includeScope1: true,
    includeScope2: true,
    includeScope3: true,
    businessGrowth: 'moderate',
    greenInitiatives: 'planned'
  });
  
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmissionsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call with mock data
      setTimeout(() => {
        setEmissionsData(mockEmissionsData);
        setLoading(false);
        setLoadingStates({
          statistics: false,
          trend: false,
          byType: false,
          monthlyComparison: false
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
      
      // Set mock data even on error for better UX
      setTimeout(() => {
        setEmissionsData(mockEmissionsData);
        setLoading(false);
        setLoadingStates({
          statistics: false,
          trend: false,
          byType: false,
          monthlyComparison: false
        });
      }, 1000);
    }
  }, []);

  useEffect(() => {
    fetchEmissionsData();
  }, [fetchEmissionsData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPredictionParams({
      ...predictionParams,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePrediction = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock prediction result
      const mockResult = {
        status: 'success',
        data: {
          predictions: [
            { period: 'Jan 2023', emissions: 1250 },
            { period: 'Feb 2023', emissions: 1180 },
            { period: 'Mar 2023', emissions: 1320 },
            { period: 'Apr 2023', emissions: 1400 },
            { period: 'May 2023', emissions: 1370 },
            { period: 'Jun 2023', emissions: 1280 },
            { period: 'Jul 2023', emissions: 1350 },
            { period: 'Aug 2023', emissions: 1330 },
            { period: 'Sep 2023', emissions: 1290 },
            { period: 'Oct 2023', emissions: 1220 },
            { period: 'Nov 2023', emissions: 1150 },
            { period: 'Dec 2023', emissions: 1100 }
          ],
          totalEmissions: 15240,
          reductionPotential: 12.5,
          confidenceScore: 85
        }
      };
      setPredictionResult(mockResult);
      setIsLoading(false);
    }, 2000);
  };

  const renderEmissionsTrend = () => {
    if (!emissionsData?.trend) return null;

    return (
      <div className="card">
        <h2>Emissions Trend</h2>
        <Spin spinning={loadingStates.trend}>
          <div className="chart-placeholder" style={{ height: '300px' }}>
            {emissionsData.trend.map((item, index) => (
              <div 
                key={index} 
                className="chart-bar" 
                style={{ 
                  height: `${(item.emissions / 1400) * 100}%`,
                  backgroundColor: `rgba(0, 255, 0, ${0.5 + (index / emissionsData.trend.length / 2)})`
                }}
                title={`${item.date}: ${item.emissions} tCO2e`}
              >
                <span className="bar-label">{item.date}</span>
              </div>
            ))}
          </div>
        </Spin>
      </div>
    );
  };

  const renderEmissionsByType = () => {
    if (!emissionsData?.byType) return null;

    return (
      <div className="card">
        <h2>Emissions by Type</h2>
        <Spin spinning={loadingStates.byType}>
          <div className="chart-container" style={{ height: '300px' }}>
            <div className="chart-legend">
              {emissionsData.byType.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{item.type}: {item.emissions} tCO2e</span>
                </div>
              ))}
            </div>
          </div>
        </Spin>
      </div>
    );
  };

  const renderMonthlyComparison = () => {
    if (!emissionsData?.monthlyComparison) return null;

    return (
      <div className="card">
        <h2>Monthly Comparison</h2>
        <Spin spinning={loadingStates.monthlyComparison}>
          <div className="chart-placeholder" style={{ height: '300px' }}>
            {emissionsData.monthlyComparison.map((item, index) => (
              <div key={index} className="comparison-container" style={{ width: `${100 / emissionsData.monthlyComparison.length}%` }}>
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${(item.current / 1500) * 100}%`,
                    backgroundColor: 'rgba(0, 255, 0, 0.8)',
                    width: '45%',
                    marginRight: '5%',
                    float: 'left'
                  }}
                  title={`Current: ${item.current} tCO2e`}
                ></div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${(item.previous / 1500) * 100}%`,
                    backgroundColor: 'rgba(0, 204, 0, 0.5)',
                    width: '45%',
                    float: 'left'
                  }}
                  title={`Previous: ${item.previous} tCO2e`}
                ></div>
                <span className="bar-label" style={{ clear: 'both', display: 'block', textAlign: 'center' }}>{item.month}</span>
              </div>
            ))}
          </div>
        </Spin>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!emissionsData?.statistics) return null;

    const { totalEmissions, changePercentage, averageEmissions } = emissionsData.statistics;

    return (
      <div className="metrics-row">
        <div className="metric-card">
          <h3>Total Emissions</h3>
          <div className="metric-value">{totalEmissions.toFixed(2)} kg CO2</div>
          <div className="metric-trend positive">↓ 12% from last month</div>
        </div>
        <div className="metric-card">
          <h3>Change from Previous Period</h3>
          <div className="metric-value">{changePercentage.toFixed(2)}%</div>
          <div className="metric-trend positive">↓ 8% from last period</div>
        </div>
        <div className="metric-card">
          <h3>Average Daily Emissions</h3>
          <div className="metric-value">{averageEmissions.toFixed(2)} kg CO2</div>
          <div className="metric-trend positive">↓ 5% from last month</div>
        </div>
      </div>
    );
  };

  const renderPredictionResult = () => {
    if (!predictionResult) return null;
    
    const { data } = predictionResult;
    
    return (
      <div className="prediction-results">
        <h3>Emission Prediction Results</h3>
        
        <div className="prediction-summary">
          <div className="summary-item">
            <span className="label">Total Predicted Emissions:</span>
            <span className="value">{data.totalEmissions.toLocaleString()} tCO2e</span>
          </div>
          <div className="summary-item">
            <span className="label">Reduction Potential:</span>
            <span className="value">{data.reductionPotential}%</span>
          </div>
          <div className="summary-item">
            <span className="label">Model Confidence:</span>
            <span className="value">{data.confidenceScore}%</span>
          </div>
        </div>
        
        <h4>Monthly Emissions Forecast</h4>
        <div className="prediction-chart">
          <div className="chart-placeholder">
            {data.predictions.map((item, index) => (
              <div 
                key={index} 
                className="chart-bar" 
                style={{ 
                  height: `${(item.emissions / 1400) * 100}%`,
                  backgroundColor: `rgba(0, 255, 0, ${0.5 + (index / data.predictions.length / 2)})`
                }}
                title={`${item.period}: ${item.emissions} tCO2e`}
              >
                <span className="bar-label">{item.period.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="prediction-insights">
          <h4>AI Insights</h4>
          <div className="insight-card">
            <i className="fas fa-lightbulb"></i>
            <div className="insight-content">
              <h5>Seasonal Pattern Detected</h5>
              <p>Your emissions show a seasonal pattern with peaks during Q2. Consider adjusting operations during these periods.</p>
            </div>
          </div>
          <div className="insight-card">
            <i className="fas fa-chart-line"></i>
            <div className="insight-content">
              <h5>Downward Trend</h5>
              <p>The prediction shows a potential 12.5% reduction in emissions if current initiatives continue.</p>
            </div>
          </div>
          <div className="insight-card">
            <i className="fas fa-leaf"></i>
            <div className="insight-content">
              <h5>Green Initiative Impact</h5>
              <p>Implementing planned green initiatives could further reduce emissions by an additional 8-10%.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

      {renderStatistics()}

      <div className="dashboard-section">
        {renderEmissionsTrend()}
      </div>

      <div className="dashboard-section">
        <div className="charts-row">
          <div className="chart-column">
            {renderEmissionsByType()}
          </div>
          <div className="chart-column">
            {renderMonthlyComparison()}
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-section emission-prediction">
          <div className="card">
            <h3>AI Emission Prediction Model</h3>
            <p className="section-description">
              Predict future carbon emissions using our advanced AI model. Adjust parameters below to generate custom predictions.
            </p>
            
            <form onSubmit={handlePrediction} className="prediction-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Prediction Timeframe</label>
                  <select 
                    name="timeframe" 
                    value={predictionParams.timeframe}
                    onChange={handleInputChange}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Duration (periods)</label>
                  <select 
                    name="duration" 
                    value={predictionParams.duration}
                    onChange={handleInputChange}
                  >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="36">36</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>Emission Scopes to Include</label>
                  <div className="checkbox-options">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="includeScope1"
                        checked={predictionParams.includeScope1}
                        onChange={handleInputChange}
                      />
                      Scope 1 (Direct)
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="includeScope2"
                        checked={predictionParams.includeScope2}
                        onChange={handleInputChange}
                      />
                      Scope 2 (Indirect)
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="includeScope3"
                        checked={predictionParams.includeScope3}
                        onChange={handleInputChange}
                      />
                      Scope 3 (Supply Chain)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Business Growth Projection</label>
                  <select 
                    name="businessGrowth" 
                    value={predictionParams.businessGrowth}
                    onChange={handleInputChange}
                  >
                    <option value="decline">Decline</option>
                    <option value="stable">Stable</option>
                    <option value="moderate">Moderate Growth</option>
                    <option value="rapid">Rapid Growth</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Green Initiatives</label>
                  <select 
                    name="greenInitiatives" 
                    value={predictionParams.greenInitiatives}
                    onChange={handleInputChange}
                  >
                    <option value="none">None</option>
                    <option value="planned">Planned</option>
                    <option value="implemented">Implemented</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="predict-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> 
                      Generating Prediction...
                    </>
                  ) : 'Generate Prediction'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="analytics-section prediction-results-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Training AI model and generating predictions...</p>
            </div>
          ) : renderPredictionResult()}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 