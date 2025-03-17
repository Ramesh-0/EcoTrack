import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Row, Col, Select, Tabs } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CloudOutlined, PlusOutlined, CalculatorOutlined } from '@ant-design/icons';
import EmissionCalculator from './EmissionCalculator';
import axios from '../utils/api';

const { Title } = Typography;
const { Option } = Select;

const Emissions = () => {
  const [loading, setLoading] = useState(true);
  const [emissions, setEmissions] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEmissions();
  }, [timeRange]);

  const fetchEmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/emissions/analytics', {
        params: { range: timeRange }
      });
      setEmissions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emissions data:', error);
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: 'CO2 Emissions',
      dataIndex: 'co2_emissions',
      key: 'co2_emissions',
      render: (text) => `${text.toFixed(2)} kg CO2e`,
    },
  ];

  const chartData = emissions.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    emissions: item.co2_emissions,
  }));

  const items = [
    {
      key: 'overview',
      label: (
        <span>
          <CloudOutlined /> Overview
        </span>
      ),
      children: (
        <>
          <Row gutter={[24, 24]} align="middle" justify="space-between">
            <Col>
              <Title level={2}>
                <CloudOutlined /> Emissions Overview
              </Title>
            </Col>
            <Col>
              <Space>
                <Select
                  value={timeRange}
                  onChange={setTimeRange}
                  style={{ width: 120 }}
                >
                  <Option value="week">Last Week</Option>
                  <Option value="month">Last Month</Option>
                  <Option value="year">Last Year</Option>
                </Select>
                <Button type="primary" icon={<PlusOutlined />}>
                  Add Emission
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card>
                <Title level={4}>Emissions Over Time</Title>
                <div style={{ height: 400, marginTop: 24 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="emissions"
                        stroke="#1890ff"
                        name="CO2 Emissions (kg CO2e)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card>
                <Title level={4}>Emissions Details</Title>
                <Table
                  columns={columns}
                  dataSource={emissions}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                  }}
                />
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'calculator',
      label: (
        <span>
          <CalculatorOutlined /> Emission Calculator
        </span>
      ),
      children: <EmissionCalculator />,
    },
  ];

  return (
    <div className="emissions-container">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        type="card"
        size="large"
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default Emissions; 