// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { message, Button } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
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
  const [supplyChainData, setSupplyChainData] = useState([]);
  const [supplyChainLoading, setSupplyChainLoading] = useState(true);

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
        setStats({
          ...response.data,
          totalEmissions: response.data.totalEmissions || 0,
          totalCompanies: response.data.totalCompanies || 0,
          totalSuppliers: response.data.totalSuppliers || 0,
          monthlyData: response.data.monthlyData?.length > 0 
            ? response.data.monthlyData 
            : emptyMonthlyData
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data');
        message.error('Failed to load dashboard data');
        // Keep the default empty state
        setStats({
          totalEmissions: 0,
          totalCompanies: 0,
          totalSuppliers: 0,
          monthlyData: emptyMonthlyData
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchSupplyChainData = async () => {
      try {
        setSupplyChainLoading(true);
        
        // First check if we have supply chain data in localStorage
        const localStorageMonthlyData = localStorage.getItem('supplyChainMonthlyEmissions');
        
        if (localStorageMonthlyData) {
          try {
            const monthlyData = JSON.parse(localStorageMonthlyData);
            
            // Convert the data to the format needed for the chart
            const processedData = Object.entries(monthlyData).map(([month, emissions]) => ({
              month,
              supplyChainEmissions: emissions
            }));
            
            setSupplyChainData(processedData);
            setSupplyChainLoading(false);
            return; // Exit early if we have localStorage data
          } catch (e) {
            console.error('Error parsing supply chain data from localStorage:', e);
            // Fall through to API call if localStorage parsing fails
          }
        }
        
        // If no localStorage data, fetch from API
        const response = await api.get('/supply-chain');
        
        // Process the supply chain data for chart display
        const processedData = processSupplyChainDataForChart(response.data);
        setSupplyChainData(processedData);
      } catch (error) {
        console.error('Error fetching supply chain data:', error);
        message.error('Failed to load supply chain data');
      } finally {
        setSupplyChainLoading(false);
      }
    };

    fetchDashboardData();
    fetchSupplyChainData();
    
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

  // Function to process supply chain data for chart display
  const processSupplyChainDataForChart = (data) => {
    if (!data || data.length === 0) return [];

    // Create a map to aggregate emissions by month
    const emissionsByMonth = new Map();
    
    // Process each supply chain entry
    data.forEach(entry => {
      // Parse the date
      const date = new Date(entry.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate total emissions for this entry
      let entryEmissions = 0;
      
      // Add up emissions from all materials in this supply chain entry
      entry.materials.forEach(material => {
        // Simple emission calculation based on transportation distance and quantity
        // This is a placeholder - you would use your actual emission calculation logic
        const materialEmission = material.quantity * 0.1 + material.transportation_distance * 0.01;
        entryEmissions += materialEmission;
      });
      
      // Add to the monthly total
      if (emissionsByMonth.has(month)) {
        emissionsByMonth.set(month, emissionsByMonth.get(month) + entryEmissions);
      } else {
        emissionsByMonth.set(month, entryEmissions);
      }
    });
    
    // Convert the map to an array of objects for the chart
    return Array.from(emissionsByMonth.entries()).map(([month, emissions]) => ({
      month,
      supplyChainEmissions: emissions
    }));
  };

  // Function to combine actual emission data with supply chain and prediction
  const getCombinedChartData = (actualData) => {
    // If no actual data provided, use empty data
    if (!actualData || !actualData.length) return emptyMonthlyData;
    
    // If no prediction data or supply chain data exists, just return the actual data
    if (!supplierPrediction && !supplyChainData.length) return actualData;

    // Make a deep copy of the actual data
    const combinedData = JSON.parse(JSON.stringify(actualData));
    
    // Add supply chain data
    if (supplyChainData.length) {
      // Match months and add supply chain emissions to the combined data
      combinedData.forEach(item => {
        const matchingEntry = supplyChainData.find(entry => entry.month === item.month);
        if (matchingEntry) {
          item.supplyChainEmissions = matchingEntry.supplyChainEmissions;
        }
      });
    }
    
    // Add a future month projection with the supplier prediction
    if (supplierPrediction && supplierPrediction.predictedEmissions) {
      const lastMonth = combinedData[combinedData.length - 1];
      let projectedEmissions = lastMonth?.emissions || 0;
      
      // Add the supplier emissions to the total
      projectedEmissions += supplierPrediction.predictedEmissions;
      
      // Add the projected data point
      combinedData.push({
        month: 'Projected',
        emissions: projectedEmissions,
        isProjection: true
      });
    }
    
    return combinedData;
  };

  const renderEmissionsChart = (data) => {
    // Ensure we have valid data to render
    const chartData = getCombinedChartData(data || emptyMonthlyData);
    
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
            name="Total Emissions"
            stroke="#00ff00"
            strokeWidth={2}
            dot={{ 
              stroke: '#00ff00', 
              strokeWidth: 2,
              fill: (entry) => entry && entry.isProjection ? '#ff9900' : '#00ff00',
              r: (entry) => entry && entry.isProjection ? 6 : 4
            }}
          />
          {supplyChainData.length > 0 && (
            <Line
              type="monotone"
              dataKey="supplyChainEmissions"
              name="Supply Chain Emissions"
              stroke="#00aaff"
              strokeWidth={2}
              dot={{ 
                stroke: '#00aaff', 
                strokeWidth: 2
              }}
            />
          )}
          {supplierPrediction && supplierPrediction.predictedEmissions && (
            <Line
              type="monotone"
              dataKey="projectedEmissions"
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

  // Calculate total supply chain emissions
  const calculateTotalSupplyChainEmissions = () => {
    if (!supplyChainData.length) return 0;
    
    return supplyChainData.reduce((total, entry) => total + entry.supplyChainEmissions, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const totalSupplyChainEmissions = calculateTotalSupplyChainEmissions();

  return (
    <div className="dashboard">
      <h1 className="page-title">Carbon Footprint Dashboard</h1>
      
      <div className="metrics-row">
        <div className="metric-card">
          <h3>Total CO2 Emissions</h3>
          <div className="metric-value">{(stats.totalEmissions || 0).toFixed(2)} tons</div>
          <div className="metric-trend positive">↓ 12% from last month</div>
          {supplierPrediction && (
            <div className="supplier-prediction-impact">
              <span>With supplier prediction: </span>
              <span className="projected-value">
                {((stats.totalEmissions || 0) + supplierPrediction.predictedEmissions).toFixed(2)} tons
              </span>
            </div>
          )}
          {totalSupplyChainEmissions > 0 && (
            <div className="supply-chain-impact">
              <span>Supply chain contribution: </span>
              <span className="supply-chain-value">
                {totalSupplyChainEmissions.toFixed(2)} tons
              </span>
            </div>
          )}
        </div>
        <div className="metric-card">
          <h3>Total Companies</h3>
          <div className="metric-value">{stats.totalCompanies || 0}</div>
          <div className="metric-trend positive">↑ 5% from last month</div>
        </div>
        <div className="metric-card">
          <h3>Total Suppliers</h3>
          <div className="metric-value">{stats.totalSuppliers || 0}</div>
          <div className="metric-trend positive">↑ 8% from last month</div>
          {supplierPrediction && (
            <div className="supplier-prediction-impact">
              <span>Prediction confidence: </span>
              <span className="confidence-value">{supplierPrediction.confidenceLevel || 0}%</span>
            </div>
          )}
          {totalSupplyChainEmissions > 0 && (
            <Link to="/supply-chain-emissions">
              <Button 
                type="primary" 
                icon={<BarChartOutlined />} 
                className="view-details-button"
              >
                View Supply Chain Details
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Monthly Emissions Trend</h2>
        <div className="card">
          {error && <div className="error-message">Error loading data</div>}
          {supplyChainLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading emissions data...</p>
            </div>
          ) : (
            renderEmissionsChart(stats.monthlyData && stats.monthlyData.length > 0 ? stats.monthlyData : emptyMonthlyData)
          )}
          <div className="prediction-notes">
            {supplierPrediction && (
              <div className="prediction-note">
                <div className="note-dot" style={{ backgroundColor: '#ff9900' }}></div>
                <span>Projected with supplier impact of {(supplierPrediction.predictedEmissions || 0).toFixed(2)} tons CO2e</span>
              </div>
            )}
            {totalSupplyChainEmissions > 0 && (
              <div className="prediction-note">
                <div className="note-dot" style={{ backgroundColor: '#00aaff' }}></div>
                <span>Supply chain emissions: {totalSupplyChainEmissions.toFixed(2)} tons CO2e</span>
              </div>
            )}
          </div>
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