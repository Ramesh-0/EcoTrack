import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Progress, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/axios';
import AddSupplierForm from './AddSupplierForm';

const SuppliersManagement = () => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => a.location.localeCompare(b.location)
    },
    {
      title: 'Emission Rating',
      dataIndex: 'emission_ratings',
      key: 'emission_ratings',
      render: (rating) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={Math.min(rating * 10, 100)}
            status={rating < 5 ? 'success' : rating < 8 ? 'normal' : 'exception'}
            showInfo={false}
          />
          <span>{rating.toFixed(1)}</span>
        </Space>
      ),
      sorter: (a, b) => a.emission_ratings - b.emission_ratings
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    }
  ];

  return (
    <Card 
      title="Suppliers Management"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
        >
          Add Supplier
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <AddSupplierForm
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSuccess={fetchSuppliers}
      />
    </Card>
  );
};

export default SuppliersManagement; 