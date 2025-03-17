import React, { useState } from 'react';
import { Card, Typography, Tabs, Row, Col, Button, Space, message } from 'antd';
import SupplyChainForm from './SupplyChainForm';
import SupplyChainList from './SupplyChainList';
import { UnorderedListOutlined, FormOutlined, PlusOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SupplyChain = () => {
  const [activeTab, setActiveTab] = useState('list');

  const handleAddNew = () => {
    setActiveTab('form');
  };

  const handleSuccess = () => {
    message.success('Supply chain record added successfully');
    setActiveTab('list');
  };

  const renderListView = () => (
    <div className="supply-chain-view">
      <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>Supply Chain Records</Title>
            <Text type="secondary">View and manage your supply chain records</Text>
          </Space>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            size="large"
          >
            Add New Record
          </Button>
        </Col>
      </Row>
      <SupplyChainList onAddNew={handleAddNew} />
    </div>
  );

  const renderFormView = () => (
    <div className="supply-chain-view">
      <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        <Col>
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>Add Supply Chain Record</Title>
            <Text type="secondary">Create a new supply chain record with materials and transportation details</Text>
          </Space>
        </Col>
        <Col>
          <Button 
            onClick={() => setActiveTab('list')}
            icon={<UnorderedListOutlined />}
          >
            Back to List
          </Button>
        </Col>
      </Row>
      <SupplyChainForm onSuccess={handleSuccess} />
    </div>
  );

  const items = [
    {
      key: 'list',
      label: (
        <span>
          <DatabaseOutlined /> Supply Chain Records
        </span>
      ),
      children: renderListView(),
    },
    {
      key: 'form',
      label: (
        <span>
          <FormOutlined /> Add New Record
        </span>
      ),
      children: renderFormView(),
    },
  ];

  return (
    <div className="supply-chain-container">
      <Card bordered={false} className="supply-chain-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          type="card"
          size="large"
          className="custom-tabs"
          animated={true}
          destroyInactiveTabPane={true}
          tabBarStyle={{
            marginBottom: 24,
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </Card>
    </div>
  );
};

export default SupplyChain; 