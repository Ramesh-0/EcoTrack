import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, Modal, message, Typography, Input, Tooltip, Badge, Avatar, Divider, Alert } from 'antd';
import { DeleteOutlined, SearchOutlined, InfoCircleOutlined, ReloadOutlined, ExclamationCircleOutlined, FilterOutlined, EyeOutlined } from '@ant-design/icons';
import supplyChainApi from '../api/supplyChainWorkaround';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;
const { confirm } = Modal;

const SupplyChainList = ({ onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [supplyChains, setSupplyChains] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSupplyChain, setSelectedSupplyChain] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchSupplyChains = async () => {
    setLoading(true);
    try {
      const response = await supplyChainApi.getSupplyChains();
      
      // Check if we're in offline/mock mode
      setOfflineMode(response.source === 'mock' || response.source === 'offline' || response.source === 'cache');
      
      // Process and format the data for better display
      const formattedData = (response.data || []).map(item => ({
        ...item,
        key: item.id,
        // Add more user-friendly formatted fields
        company_name: getCompanyName(item.company_id),
        supplier_name: getSupplierName(item.supplier_id),
        material_name: getMaterialName(item.material_id)
      }));
      
      setSupplyChains(formattedData);
      setFilteredData(formattedData);
      
      if (response.source !== 'mock' && response.source !== 'offline' && response.source !== 'cache') {
        message.success('Supply chain data loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching supply chains:', error);
      message.error('Failed to fetch supply chain data');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions to display names instead of IDs
  const getCompanyName = (id) => {
    // This would ideally fetch from a lookup table, but for now using simple mapping
    const companies = {
      'Company A': 'Acme Corporation',
      'Company B': 'Globex Industries',
      'Company C': 'Sirius Cybernetics'
    };
    return companies[id] || id;
  };
  
  const getSupplierName = (id) => {
    const suppliers = {
      'Supplier X': 'XYZ Manufacturing',
      'Supplier Y': 'YellowStone Materials',
      'Supplier Z': 'Zenith Logistics'
    };
    return suppliers[id] || id;
  };
  
  const getMaterialName = (id) => {
    const materials = {
      'Raw Material 1': 'Aluminum',
      'Component B': 'Circuit Boards',
      'Packaging': 'Recycled Cardboard'
    };
    return materials[id] || id;
  };
  
  const getCompanyInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const getCompanyColor = (name) => {
    const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    fetchSupplyChains();
  }, []);

  const showDeleteConfirm = (record) => {
    confirm({
      title: 'Are you sure you want to delete this supply chain record?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div style={{ padding: '12px 0' }}>
          <Paragraph>This action cannot be undone. The following record will be permanently deleted:</Paragraph>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
            <Text strong>Company:</Text> {record.company_name}<br />
            <Text strong>Supplier:</Text> {record.supplier_name}<br />
            <Text strong>Material:</Text> {record.material_name}<br />
            <Text strong>Quantity:</Text> {record.quantity} {record.unit}
          </div>
        </div>
      ),
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        handleDelete(record.id);
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      await supplyChainApi.deleteSupplyChain(id);
      message.success('Supply chain deleted successfully');
      fetchSupplyChains();
      
      // Notify parent component about the refresh if callback exists
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting supply chain:', error);
      message.error('Failed to delete supply chain');
    }
  };
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (!value) {
      setFilteredData(supplyChains);
      return;
    }
    
    // Filter the supply chains based on search text
    const filtered = supplyChains.filter(item => {
      const searchVal = value.toLowerCase();
      return (
        (item.company_name && item.company_name.toLowerCase().includes(searchVal)) ||
        (item.supplier_name && item.supplier_name.toLowerCase().includes(searchVal)) ||
        (item.material_name && item.material_name.toLowerCase().includes(searchVal))
      );
    });
    
    setFilteredData(filtered);
  };
  
  const showDetailModal = (record) => {
    setSelectedSupplyChain(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: getCompanyColor(text), 
              marginRight: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {getCompanyInitials(text)}
          </Avatar>
          <Text strong>{text}</Text>
        </div>
      ),
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      sorter: (a, b) => a.supplier_name.localeCompare(b.supplier_name),
    },
    {
      title: 'Material',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text) => <Tag color="blue" style={{ padding: '0 8px' }}>{text}</Tag>,
      filters: [
        { text: 'Aluminum', value: 'Aluminum' },
        { text: 'Circuit Boards', value: 'Circuit Boards' },
        { text: 'Recycled Cardboard', value: 'Recycled Cardboard' },
      ],
      onFilter: (value, record) => record.material_name === value,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text, record) => `${text} ${record.unit}`,
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
            style={{ color: '#1890ff' }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card 
      bordered={false}
      style={{ 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderRadius: '8px'
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <FilterOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
            <Title level={4} style={{ margin: 0 }}>Supply Chain Records</Title>
            <Badge 
              count={filteredData.length} 
              style={{ backgroundColor: '#52c41a' }}
              offset={[8, 0]}
            />
          </Space>
          <div>
            <Button 
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchSupplyChains}
              style={{ marginRight: '12px' }}
              loading={loading}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      }
      extra={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {offlineMode && (
            <Tooltip title="Currently in offline mode - using locally stored data">
              <Tag color="orange" style={{ marginRight: '12px', fontSize: '13px', padding: '0 8px' }}>
                <InfoCircleOutlined /> Offline Mode
              </Tag>
            </Tooltip>
          )}
          <Input
            placeholder="Search companies, suppliers, or materials"
            prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
            value={searchText}
            onChange={handleSearch}
            style={{ width: 300, borderRadius: '6px' }}
            allowClear
            size="middle"
          />
        </div>
      }
    >
      {filteredData.length === 0 && searchText && (
        <Alert
          message="No matching records found"
          description="Try adjusting your search criteria."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          pageSizeOptions: ['5', '10', '20', '50']
        }}
        locale={{
          emptyText: 'No supply chain records found'
        }}
        bordered
        size="middle"
        scroll={{ x: true }}
      />

      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EyeOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
            <span>Supply Chain Details</span>
          </div>
        )}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedSupplyChain && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', marginBottom: '24px' }}>
              <Avatar 
                size={64} 
                style={{ 
                  backgroundColor: getCompanyColor(selectedSupplyChain.company_name),
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '24px'
                }}
              >
                {getCompanyInitials(selectedSupplyChain.company_name)}
              </Avatar>
              <div style={{ marginLeft: '16px' }}>
                <Title level={4} style={{ margin: 0 }}>{selectedSupplyChain.company_name}</Title>
                <Text type="secondary">ID: {selectedSupplyChain.id}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color="green">Active</Tag>
                  <Tag color="blue">{selectedSupplyChain.material_name}</Tag>
                </div>
              </div>
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Text type="secondary">Supplier</Text>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedSupplyChain.supplier_name}</div>
              </div>
              <div>
                <Text type="secondary">Material</Text>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedSupplyChain.material_name}</div>
              </div>
              <div>
                <Text type="secondary">Quantity</Text>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedSupplyChain.quantity} {selectedSupplyChain.unit}</div>
              </div>
              <div>
                <Text type="secondary">Created Date</Text>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{dayjs(selectedSupplyChain.created_at).format('MMMM D, YYYY')}</div>
              </div>
            </div>
            
            {selectedSupplyChain.transport_emissions && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <Title level={5}>Emissions Data</Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <Text type="secondary">Transport Emissions</Text>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedSupplyChain.transport_emissions.toFixed(2)} kg CO₂e</div>
                  </div>
                  <div>
                    <Text type="secondary">Material Emissions</Text>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedSupplyChain.material_emissions?.toFixed(2) || 'N/A'} kg CO₂e</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SupplyChainList; 