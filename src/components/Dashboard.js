// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, message, Spin, Empty } from 'antd';
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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="emissions"
          stroke="#00A86B"
          strokeWidth={2}
          dot={{ stroke: '#00A86B', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Carbon Footprint Dashboard</h1>
      
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total CO2 Emissions"
              value={stats.totalEmissions}
              suffix="tons"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Companies"
              value={stats.totalCompanies}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Suppliers"
              value={stats.totalSuppliers}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Monthly Emissions Trend" 
        className="chart-card"
        extra={error && <span style={{ color: '#ff4d4f' }}>Error loading data</span>}
      >
        {renderEmissionsChart(stats.monthlyData?.length > 0 ? stats.monthlyData : emptyMonthlyData)}
        {stats.monthlyData?.length === 0 && !error && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Empty description="No emissions data available yet" />
          </div>
        )}
      </Card>

      <section className="dashboard-section">
        <h2>Supplier Recommendations</h2>
        <SupplierTable />
      </section>

      <section className="dashboard-section">
        <h2>ESG Reports</h2>
        <ESGReports />
      </section>
    </div>
  );
};

export default Dashboard;