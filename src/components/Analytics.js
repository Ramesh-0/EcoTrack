import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Spin, Alert, Button, message } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Cache for storing fetched data
const dataCache = new Map();

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [emissionsData, setEmissionsData] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [loadingStates, setLoadingStates] = useState({
    statistics: true,
    trend: true,
    byType: true,
    monthlyComparison: true
  });

  // Memoize the date range string for cache key
  const cacheKey = useMemo(() => {
    if (!dateRange) return 'default';
    const [start, end] = dateRange;
    return `${start?.toISOString().split('T')[0]}-${end?.toISOString().split('T')[0]}-${timeframe}`;
  }, [dateRange, timeframe]);

  useEffect(() => {
    fetchEmissionsData();
  }, [dateRange, timeframe]);

  const fetchEmissionsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (dataCache.has(cacheKey)) {
        setEmissionsData(dataCache.get(cacheKey));
        setLoading(false);
        return;
      }

      // Get the date range for the query
      let startDate, endDate;
      if (dateRange) {
        [startDate, endDate] = dateRange;
      } else {
        // Default to last 30 days if no date range selected
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      // Fetch emissions data from the backend
      const response = await api.get('/emissions/analytics', {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          timeframe
        }
      });

      const data = response.data;
      setEmissionsData(data);
      dataCache.set(cacheKey, data);

      // Clear old cache entries (keep only last 5)
      if (dataCache.size > 5) {
        const firstKey = dataCache.keys().next().value;
        dataCache.delete(firstKey);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingStates({
        statistics: false,
        trend: false,
        byType: false,
        monthlyComparison: false
      });
    }
  };

  const generateTestData = async () => {
    try {
      setLoading(true);
      await api.post('/test-data');
      message.success('Test data generated successfully');
      fetchEmissionsData(); // Refresh the data
    } catch (error) {
      console.error('Error generating test data:', error);
      message.error('Failed to generate test data');
    } finally {
      setLoading(false);
    }
  };

  const renderEmissionsTrend = () => {
    if (!emissionsData?.trend) return null;

    return (
      <Card title="Emissions Trend">
        <Spin spinning={loadingStates.trend}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={emissionsData.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="emissions" stroke="#8884d8" name="Emissions" />
            </LineChart>
          </ResponsiveContainer>
        </Spin>
      </Card>
    );
  };

  const renderEmissionsByType = () => {
    if (!emissionsData?.byType) return null;

    return (
      <Card title="Emissions by Type">
        <Spin spinning={loadingStates.byType}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emissionsData.byType}
                dataKey="emissions"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {emissionsData.byType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Spin>
      </Card>
    );
  };

  const renderMonthlyComparison = () => {
    if (!emissionsData?.monthlyComparison) return null;

    const data = emissionsData.monthlyComparison.map(item => ({
      month: item.month,
      current: item.current,
      previous: item.previous
    }));

    return (
      <Card title="Monthly Comparison">
        <Spin spinning={loadingStates.monthlyComparison}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="#8884d8" name="Current" />
              <Bar dataKey="previous" fill="#82ca9d" name="Previous" />
            </BarChart>
          </ResponsiveContainer>
        </Spin>
      </Card>
    );
  };

  const renderStatistics = () => {
    if (!emissionsData?.statistics) return null;

    const { totalEmissions, changePercentage, averageEmissions } = emissionsData.statistics;

    return (
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Spin spinning={loadingStates.statistics}>
              <Statistic
                title="Total Emissions"
                value={totalEmissions}
                suffix="kg CO2"
                precision={2}
              />
            </Spin>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Spin spinning={loadingStates.statistics}>
              <Statistic
                title="Change from Previous Period"
                value={changePercentage}
                precision={2}
                valueStyle={{ color: changePercentage >= 0 ? '#cf1322' : '#3f8600' }}
                prefix={changePercentage >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix="%"
              />
            </Spin>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Spin spinning={loadingStates.statistics}>
              <Statistic
                title="Average Daily Emissions"
                value={averageEmissions}
                suffix="kg CO2"
                precision={2}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    );
  };

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <Select
            value={timeframe}
            onChange={setTimeframe}
            style={{ width: '100%' }}
          >
            <Option value="day">Daily</Option>
            <Option value="week">Weekly</Option>
            <Option value="month">Monthly</Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={generateTestData}
            loading={loading}
          >
            Generate Test Data
          </Button>
        </Col>
      </Row>

      {renderStatistics()}

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          {renderEmissionsTrend()}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          {renderEmissionsByType()}
        </Col>
        <Col span={12}>
          {renderMonthlyComparison()}
        </Col>
      </Row>
    </div>
  );
};

export default Analytics; 