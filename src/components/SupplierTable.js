// components/SupplierTable.js
import React, { useState, useEffect } from 'react';
import { Table, Progress, Empty } from 'antd';
import api from '../api/axios';

const SupplierTable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierData, setSupplierData] = useState([]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || '')
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => (a.location || '').localeCompare(b.location || '')
    },
    {
      title: 'Sustainability Score',
      dataIndex: 'emission_ratings',
      key: 'emission_ratings',
      sorter: (a, b) => (Number(a.emission_ratings) || 0) - (Number(b.emission_ratings) || 0),
      render: (score) => {
        const numScore = Number(score) || 0;
        return (
          <Progress
            percent={numScore}
            size="small"
            status={numScore < 50 ? 'exception' : 'active'}
            strokeColor={numScore < 50 ? '#ff4d4f' : numScore < 80 ? '#faad14' : '#52c41a'}
          />
        );
      }
    }
  ];

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/suppliers');
        
        // Ensure we have an array of suppliers
        const suppliers = Array.isArray(response.data) ? response.data : [];
        
        // Transform the data to include keys and handle missing values
        const formattedData = suppliers.map((supplier, index) => ({
          key: supplier.id || String(index),
          name: supplier.name || 'Unknown',
          location: supplier.location || 'Unknown',
          emission_ratings: supplier.emission_ratings || 0,
          created_at: supplier.created_at
        }));
        
        setSupplierData(formattedData);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to fetch suppliers');
        setSupplierData([]); // Ensure empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Table
        dataSource={supplierData}
        columns={columns}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} ${total === 1 ? 'supplier' : 'suppliers'}`
        }}
        locale={{
          emptyText: error ? (
            <Empty 
              description={
                <span>
                  {error}
                  <br />
                  <a onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
                    Click to retry
                  </a>
                </span>
              }
            />
          ) : (
            <Empty description="No suppliers found" />
          )
        }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default SupplierTable;
