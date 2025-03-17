import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';

const SupplyChainList = () => {
  const [loading, setLoading] = useState(false);
  const [supplyChains, setSupplyChains] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSupplyChain, setSelectedSupplyChain] = useState(null);

  const fetchSupplyChains = async () => {
    setLoading(true);
    try {
      const response = await api.get('/supply-chain');
      setSupplyChains(response.data);
    } catch (error) {
      console.error('Error fetching supply chains:', error);
      message.error('Failed to fetch supply chain data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyChains();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/supply-chain/${id}`);
      message.success('Supply chain deleted successfully');
      fetchSupplyChains();
    } catch (error) {
      console.error('Error deleting supply chain:', error);
      message.error('Failed to delete supply chain');
    }
  };

  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Materials',
      key: 'materials',
      render: (_, record) => (
        <Space direction="vertical">
          {record.materials.map((material, index) => (
            <div key={index}>
              <Tag color="blue">{material.material_type}</Tag>
              <span> - {material.quantity} units</span>
              <br />
              <Tag color="green">{material.transportation_type}</Tag>
              <span> - {material.transportation_distance} km</span>
              <br />
              <span>Date: {dayjs(material.transportation_date).format('YYYY-MM-DD')}</span>
              {material.notes && <div style={{ color: '#666' }}>Notes: {material.notes}</div>}
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setSelectedSupplyChain(record);
            setDeleteModalVisible(true);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Card title="Supply Chain Records">
      <Table
        columns={columns}
        dataSource={supplyChains}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={() => {
          handleDelete(selectedSupplyChain.id);
          setDeleteModalVisible(false);
        }}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>Are you sure you want to delete this supply chain record?</p>
      </Modal>
    </Card>
  );
};

export default SupplyChainList; 