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
  }, []);

  const renderEmissionsChart = (data) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
          dot={{ stroke: '#00ff00', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

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
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Monthly Emissions Trend</h2>
        <div className="card">
          {error && <div className="error-message">Error loading data</div>}
          {renderEmissionsChart(stats.monthlyData?.length > 0 ? stats.monthlyData : emptyMonthlyData)}
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