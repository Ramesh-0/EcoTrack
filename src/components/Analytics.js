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

  // AI Supplier Emission Model states
  const [supplierEmissionParams, setSupplierEmissionParams] = useState({
    supplierEmissions: '',
    transportDistance: '',
    industryType: 'manufacturing'
  });
  const [supplierPredictionResult, setSupplierPredictionResult] = useState(null);
  const [supplierPredictionLoading, setSupplierPredictionLoading] = useState(false);

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

  const handleSupplierEmissionInputChange = (e) => {
    const { name, value } = e.target;
    setSupplierEmissionParams({
      ...supplierEmissionParams,
      [name]: value
    });
  };

  const handleSupplierPrediction = async (e) => {
    e.preventDefault();
    setSupplierPredictionLoading(true);
    
    try {
      // Call your custom API endpoint here
      const response = await fetch('/api/supplier-emission-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierEmissionParams)
      });
      
      if (!response.ok) {
        throw new Error('Failed to get prediction from API');
      }
      
      const result = await response.json();
      setSupplierPredictionResult(result);
      
      // Save the prediction result to localStorage
      localStorage.setItem('supplierPrediction', JSON.stringify(result));
    } catch (error) {
      console.error('Error predicting supplier emissions:', error);
      // Fallback to mock data for demo
      const mockResult = {
        predictedEmissions: parseFloat(supplierEmissionParams.supplierEmissions) * 1.5 + 
                           (parseFloat(supplierEmissionParams.transportDistance) * 0.2),
        confidenceLevel: 87,
        emissionComponents: {
          baseEmissions: parseFloat(supplierEmissionParams.supplierEmissions),
          transportEmissions: parseFloat(supplierEmissionParams.transportDistance) * 0.2,
          industryFactor: 1.5
        },
        reductionPotential: 12.5,
        recommendations: [
          "Optimize transport routes to reduce mileage",
          "Consider local suppliers to reduce transport emissions",
          "Implement energy efficiency measures at supplier facilities"
        ]
      };
      
      setSupplierPredictionResult(mockResult);
      
      // Save the mock prediction result to localStorage
      localStorage.setItem('supplierPrediction', JSON.stringify(mockResult));
    } finally {
      setSupplierPredictionLoading(false);
    }
  };

  const renderEmissionsTrend = () => {
    if (!emissionsData?.trend) return null;

    // Include prediction data in the trend chart if available
    const combinedData = [...emissionsData.trend];
    
    // Add prediction data if available
    if (supplierPredictionResult) {
      // Add a visual separator
      combinedData.push({ 
        date: '---', 
        emissions: null, 
        isPrediction: true 
      });
      
      // Add prediction as a future month
      combinedData.push({ 
        date: 'Pred', 
        emissions: supplierPredictionResult.predictedEmissions, 
        isPrediction: true 
      });
    }

    return (
      <div className="chart-container emissions-trend">
        <h3>Emissions Trend</h3>
        <div className="chart-placeholder">
          {combinedData.map((item, index) => (
            item.emissions === null ? (
              <div 
                key={index} 
                className="chart-separator"
                style={{
                  width: '1px',
                  backgroundColor: '#ccc',
                  margin: '0 10px'
                }}
              ></div>
            ) : (
              <div 
                key={index} 
                className={`chart-bar ${item.isPrediction ? 'prediction-bar' : ''}`}
                style={{ 
                  height: `${(item.emissions / 1400) * 100}%`,
                  backgroundColor: item.isPrediction ? 
                    'rgba(255, 153, 0, 0.8)' : 
                    `rgba(0, 255, 0, ${0.5 + (index / emissionsData.trend.length / 2)})`,
                  border: item.isPrediction ? '2px dashed #ff9900' : 'none'
                }}
                title={`${item.date}: ${item.emissions} ${item.isPrediction ? '(Predicted)' : ''} tCO2e`}
              >
                <span className="bar-label">{item.date}</span>
              </div>
            )
          ))}
        </div>
        {supplierPredictionResult && (
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgba(0, 255, 0, 0.7)' }}></span>
              <span>Actual Emissions</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgba(255, 153, 0, 0.8)' }}></span>
              <span>Predicted Emissions</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmissionsByType = () => {
    if (!emissionsData?.byType) return null;
    
    // Create a copy of emissions data to add prediction
    const typesData = [...emissionsData.byType];
    
    // Add prediction data if available
    if (supplierPredictionResult) {
      typesData.push({
        type: 'Supplier (Predicted)',
        emissions: supplierPredictionResult.predictedEmissions,
        isPrediction: true
      });
    }
    
    return (
      <div className="chart-container emissions-by-type">
        <h3>Emissions by Type</h3>
        <div className="pie-chart-placeholder">
          <div className="pie-segments">
            {typesData.map((item, index) => {
              const total = typesData.reduce((sum, item) => sum + item.emissions, 0);
              const percent = (item.emissions / total) * 100;
              return (
                <div 
                  key={index} 
                  className="pie-segment" 
                  style={{ 
                    backgroundColor: item.isPrediction ? 
                      'rgba(255, 153, 0, 0.8)' : 
                      COLORS[index % COLORS.length],
                    width: '20px', 
                    height: '20px',
                    margin: '5px',
                    border: item.isPrediction ? '2px dashed #ff9900' : 'none'
                  }}
                  title={`${item.type}: ${item.emissions} tCO2e (${percent.toFixed(1)}%)`}
                >
                </div>
              );
            })}
          </div>
          <div className="pie-legend">
            {typesData.map((item, index) => {
              const total = typesData.reduce((sum, item) => sum + item.emissions, 0);
              const percent = (item.emissions / total) * 100;
              return (
                <div key={index} className="legend-item">
                  <span 
                    className="legend-color" 
                    style={{ 
                      backgroundColor: item.isPrediction ? 
                        'rgba(255, 153, 0, 0.8)' : 
                        COLORS[index % COLORS.length],
                      border: item.isPrediction ? '2px dashed #ff9900' : 'none'
                    }}
                  ></span>
                  <span className="legend-label">{item.type}</span>
                  <span className="legend-value">{percent.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyComparison = () => {
    if (!emissionsData?.monthlyComparison) return null;
    
    return (
      <div className="chart-container monthly-comparison">
        <h3>Monthly Comparison</h3>
        <div className="chart-placeholder">
          {emissionsData.monthlyComparison.map((item, index) => (
            <div key={index} className="comparison-bar-group">
              <div 
                className="comparison-bar current" 
                style={{ height: `${(item.current / 1500) * 100}%` }}
                title={`Current: ${item.current} tCO2e`}
              ></div>
              <div 
                className="comparison-bar previous" 
                style={{ height: `${(item.previous / 1500) * 100}%` }}
                title={`Previous: ${item.previous} tCO2e`}
              ></div>
              <span className="comparison-label">{item.month}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color current"></span>
            <span>Current</span>
          </div>
          <div className="legend-item">
            <span className="legend-color previous"></span>
            <span>Previous</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!emissionsData?.statistics) return null;
    
    const { totalEmissions, changePercentage, averageEmissions } = emissionsData.statistics;
    
    // Calculate updated statistics with prediction
    const predictionImpact = supplierPredictionResult ? 
      supplierPredictionResult.predictedEmissions : 0;
      
    const updatedTotal = totalEmissions + predictionImpact;
    
    const predictionChangePercent = supplierPredictionResult && totalEmissions > 0 ? 
      (predictionImpact / totalEmissions) * 100 : 0;
    
    return (
      <div className="statistics-container">
        <div className="statistic-card">
          <h3>Total Emissions</h3>
          <div className="statistic-value">{totalEmissions.toLocaleString()} tCO2e</div>
          {supplierPredictionResult && (
            <div className="statistic-prediction">
              <span>With prediction: </span>
              <span className="predicted-value">{updatedTotal.toLocaleString()} tCO2e</span>
              <span className={`change-indicator ${predictionChangePercent > 0 ? 'negative' : 'positive'}`}>
                ({predictionChangePercent > 0 ? '+' : ''}{predictionChangePercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
        
        <div className="statistic-card">
          <h3>Change from Previous Period</h3>
          <div className={`statistic-value ${changePercentage < 0 ? 'positive' : 'negative'}`}>
            {changePercentage < 0 ? '↓' : '↑'} {Math.abs(changePercentage).toFixed(1)}%
          </div>
          {supplierPredictionResult && (
            <div className="statistic-prediction">
              <span>Reduction potential: </span>
              <span className="predicted-value positive">
                ↓ {supplierPredictionResult.reductionPotential}%
              </span>
            </div>
          )}
        </div>
        
        <div className="statistic-card">
          <h3>Average Daily Emissions</h3>
          <div className="statistic-value">{averageEmissions.toLocaleString()} tCO2e</div>
          {supplierPredictionResult && (
            <div className="statistic-prediction">
              <span>Prediction confidence: </span>
              <span className="predicted-value">{supplierPredictionResult.confidenceLevel}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSupplierPredictionResult = () => {
    if (!supplierPredictionResult) return null;
    
    return (
      <div className="prediction-results">
        <h3>Supplier Emission Prediction Results</h3>
        
        <div className="prediction-summary">
          <div className="summary-item">
            <span className="label">Predicted Carbon Footprint:</span>
            <span className="value">{supplierPredictionResult.predictedEmissions.toFixed(2)} tCO2e</span>
          </div>
          <div className="summary-item">
            <span className="label">Model Confidence:</span>
            <span className="value">{supplierPredictionResult.confidenceLevel}%</span>
          </div>
          <div className="summary-item">
            <span className="label">Reduction Potential:</span>
            <span className="value">{supplierPredictionResult.reductionPotential}%</span>
          </div>
        </div>
        
        <h4>Emission Components</h4>
        <div className="prediction-chart">
          <div className="chart-placeholder">
            {Object.entries(supplierPredictionResult.emissionComponents).map(([key, value], index) => (
              <div 
                key={index} 
                className="chart-bar" 
                style={{ 
                  height: `${(value / (supplierPredictionResult.predictedEmissions * 1.2)) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
                title={`${key}: ${value.toFixed(2)} tCO2e`}
              >
                <span className="bar-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="prediction-insights">
          <h4>Reduction Recommendations</h4>
          {supplierPredictionResult.recommendations.map((recommendation, index) => (
            <div key={index} className="insight-card">
              <i className="fas fa-lightbulb"></i>
              <div className="insight-content">
                <p>{recommendation}</p>
              </div>
            </div>
          ))}
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
      
      {supplierPredictionResult && (
        <div className="dashboard-section mt-4">
          <div className="impact-summary-card">
            <h3>Supplier Emission Impact Summary</h3>
            <div className="impact-content">
              <div className="impact-metric">
                <div className="impact-label">Current Total Emissions:</div>
                <div className="impact-value">{emissionsData?.statistics.totalEmissions.toLocaleString()} tCO2e</div>
              </div>
              <div className="impact-metric">
                <div className="impact-label">Predicted Supplier Emissions:</div>
                <div className="impact-value highlight">{supplierPredictionResult.predictedEmissions.toFixed(2)} tCO2e</div>
              </div>
              <div className="impact-metric">
                <div className="impact-label">Supplier Contribution:</div>
                <div className="impact-value">
                  {((supplierPredictionResult.predictedEmissions / emissionsData?.statistics.totalEmissions) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div className="impact-metric">
                <div className="impact-label">Reduction Potential:</div>
                <div className="impact-value positive">Up to {supplierPredictionResult.reductionPotential}% reduction possible</div>
              </div>
            </div>
            <div className="impact-actions">
              <button className="impact-action-btn" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                View Detailed Prediction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Supplier Emission Prediction Section */}
      <div className="analytics-grid mt-5">
        <div className="analytics-section emission-prediction">
          <div className="card">
            <h3>AI Supplier Emission Prediction Model</h3>
            <p className="section-description">
              Predict supplier carbon footprint based on supplier emissions, transport distance, and industry type.
            </p>
            
            <form onSubmit={handleSupplierPrediction} className="prediction-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier Emissions (tCO2e)</label>
                  <input
                    type="number"
                    name="supplierEmissions"
                    value={supplierEmissionParams.supplierEmissions}
                    onChange={handleSupplierEmissionInputChange}
                    placeholder="Enter base emissions"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Transport Distance (km)</label>
                  <input
                    type="number"
                    name="transportDistance"
                    value={supplierEmissionParams.transportDistance}
                    onChange={handleSupplierEmissionInputChange}
                    placeholder="Enter transport distance"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Industry Type</label>
                  <select 
                    name="industryType" 
                    value={supplierEmissionParams.industryType}
                    onChange={handleSupplierEmissionInputChange}
                  >
                    <option value="manufacturing">Manufacturing</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="technology">Technology</option>
                    <option value="energy">Energy</option>
                    <option value="transportation">Transportation</option>
                    <option value="retail">Retail</option>
                    <option value="construction">Construction</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="predict-btn" disabled={supplierPredictionLoading}>
                  {supplierPredictionLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> 
                      Predicting Carbon Footprint...
                    </>
                  ) : 'Predict Carbon Footprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="analytics-section prediction-results-section">
          {supplierPredictionLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Analyzing supplier data and predicting emissions...</p>
            </div>
          ) : renderSupplierPredictionResult()}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 