// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EmissionsChart from './EmissionsChart';
import SupplierTable from './SupplierTable';
import ESGReports from './ESGReports';
import api from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmissions: 0,
    totalCompanies: 0,
    totalSuppliers: 0,
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierPrediction, setSupplierPrediction] = useState(null);

  // Sample months for empty state
  const emptyMonthlyData = [
    { month: 'Jan', emissions: 0 },
    { month: 'Feb', emissions: 0 },
    { month: 'Mar', emissions: 0 },
    { month: 'Apr', emissions: 0 },
    { month: 'May', emissions: 0 },
    { month: 'Jun', emissions: 0 }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data');
        message.error('Failed to load dashboard data');
        // Keep the default empty state
        setStats(prev => ({
          ...prev,
          monthlyData: emptyMonthlyData
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Try to retrieve any saved supplier prediction data from localStorage
    const savedPrediction = localStorage.getItem('supplierPrediction');
    if (savedPrediction) {
      try {
        setSupplierPrediction(JSON.parse(savedPrediction));
      } catch (e) {
        console.error('Error parsing saved prediction data:', e);
      }
    }
  }, []);

  // Function to combine actual emission data with prediction
  const getCombinedChartData = (actualData) => {
    // If no prediction data exists, just return the actual data
    if (!supplierPrediction) return actualData;

    // Make a deep copy of the actual data
    const combinedData = JSON.parse(JSON.stringify(actualData));
    
    // Add a future month projection with the supplier prediction
    const lastMonth = combinedData[combinedData.length - 1];
    let projectedEmissions = lastMonth.emissions;
    
    // Add the supplier emissions to the total
    projectedEmissions += supplierPrediction.predictedEmissions;
    
    // Add the projected data point
    combinedData.push({
      month: 'Projected',
      emissions: projectedEmissions,
      isProjection: true
    });
    
    return combinedData;
  };

  const renderEmissionsChart = (data) => {
    const chartData = getCombinedChartData(data);
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis dataKey="month" stroke="#a0a0a0" />
          <YAxis stroke="#a0a0a0" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend 
            wrapperStyle={{ 
              color: '#ffffff',
              paddingTop: '20px'
            }}
          />
          <Line
            type="monotone"
            dataKey="emissions"
            stroke="#00ff00"
            strokeWidth={2}
            dot={{ 
              stroke: '#00ff00', 
              strokeWidth: 2,
              fill: (entry) => entry.isProjection ? '#ff9900' : '#00ff00',
              r: (entry) => entry.isProjection ? 6 : 4
            }}
          />
          {supplierPrediction && (
            <Line
              type="monotone"
              dataKey="projection"
              name="Projected with Supplier"
              stroke="#ff9900"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Carbon Footprint Dashboard</h1>
      
      <div className="metrics-row">
        <div className="metric-card">
          <h3>Total CO2 Emissions</h3>
          <div className="metric-value">{stats.totalEmissions.toFixed(2)} tons</div>
          <div className="metric-trend positive">↓ 12% from last month</div>
          {supplierPrediction && (
            <div className="supplier-prediction-impact">
              <span>With supplier prediction: </span>
              <span className="projected-value">
                {(stats.totalEmissions + supplierPrediction.predictedEmissions).toFixed(2)} tons
              </span>
            </div>
          )}
        </div>
        <div className="metric-card">
          <h3>Total Companies</h3>
          <div className="metric-value">{stats.totalCompanies}</div>
          <div className="metric-trend positive">↑ 5% from last month</div>
        </div>
        <div className="metric-card">
          <h3>Total Suppliers</h3>
          <div className="metric-value">{stats.totalSuppliers}</div>
          <div className="metric-trend positive">↑ 8% from last month</div>
          {supplierPrediction && (
            <div className="supplier-prediction-impact">
              <span>Prediction confidence: </span>
              <span className="confidence-value">{supplierPrediction.confidenceLevel}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Monthly Emissions Trend</h2>
        <div className="card">
          {error && <div className="error-message">Error loading data</div>}
          {renderEmissionsChart(stats.monthlyData?.length > 0 ? stats.monthlyData : emptyMonthlyData)}
          {supplierPrediction && (
            <div className="prediction-notes">
              <div className="prediction-note">
                <div className="note-dot" style={{ backgroundColor: '#ff9900' }}></div>
                <span>Projected with supplier impact of {supplierPrediction.predictedEmissions.toFixed(2)} tons CO2e</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Supplier Recommendations</h2>
        <div className="card">
          <SupplierTable />
        </div>
      </div>

      <div className="dashboard-section">
        <h2>ESG Reports</h2>
        <div className="card">
          <ESGReports />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;