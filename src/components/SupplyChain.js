import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Empty, Spin, message, Tabs, Tag, Tooltip, Row, Col, Statistic, Space, Divider, Result } from 'antd';
import { 
  ReloadOutlined,
  BranchesOutlined,
  FormOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  DatabaseOutlined,
  LoginOutlined,
  LockOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import supplyChainApi from '../api/supplyChainWorkaround';
import SupplyChainForm from './SupplyChainForm';
import SupplyChainList from './SupplyChainList';
import SupplyChainEmissionsDetail from './SupplyChainEmissionsDetail';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Enhanced theme colors
const theme = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  headerBg: '#f0f5ff',
  cardShadow: '0 4px 12px rgba(0,0,0,0.08)'
};

const SupplyChain = () => {
  const [supplyChains, setSupplyChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [offlineMode, setOfflineMode] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalQuantity: 0,
    uniqueCompanies: 0,
    uniqueSuppliers: 0
  });

  useEffect(() => {
    fetchSupplyChains();
  }, []);

  // Test API connection
  const testApiConnection = async () => {
    try {
      setConnectionStatus({ testing: true });
      const result = await supplyChainApi.testConnection();
      setConnectionStatus(result);
      return result;
    } catch (error) {
      console.error('Error testing API connection:', error);
      setConnectionStatus({ 
        connected: false, 
        errorType: 'exception', 
        message: error.message || 'Failed to run connection test' 
      });
      return { connected: false };
    }
  };

  const fetchSupplyChains = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAuthError(false);
      setConnectionStatus(null);
      
      // Use retry mechanism by default
      const response = await supplyChainApi.getSupplyChains({
        retry: true,
        maxRetries: 2
      });
      
      // Check if we're in offline/mock mode
      setOfflineMode(response.source === 'mock' || response.source === 'offline' || response.source === 'cache');
      
      // Check if auth error but with mock data
      if (response.authError) {
        message.warning('You are viewing demonstration data. Log in for real data.');
        setIsAuthError(false); // Don't show the login page since we have mock data
      } else if (response.source === 'mock' || response.source === 'offline' || response.source === 'cache') {
        // Display message when using mock/offline data
        if (response.error) {
          const errorType = response.error.type;
          if (errorType === 'network') {
            message.warning('Network error detected. Using offline data.');
          } else if (errorType === 'server') {
            message.warning('Server error detected. Using offline data.');
          } else {
            message.warning('Using offline data. Some features may be limited.');
          }
        } else {
          message.warning('Using offline data. Some features may be limited.');
        }
      }
      
      // Handle empty response
      if (response.empty) {
        setSupplyChains([]);
        calculateStats([]);
        return;
      }
      
      // Format the data for better display
      const formattedData = (response.data || []).map(item => ({
        ...item,
        key: item.id,
        // Add more user-friendly formatted fields
        company_name: getCompanyName(item.company_id),
        supplier_name: getSupplierName(item.supplier_id),
        material_name: getMaterialName(item.material_id)
      }));
      
      setSupplyChains(formattedData);
      calculateStats(formattedData);
      message.success('Supply chain data loaded successfully');
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
      
      // Test connection if we encounter certain errors
      if (error.message === 'Network Error' || 
          (error.response && error.response.status >= 500) || 
          !error.response) {
        // Test connection to determine more specific issue
        const connectionTest = await testApiConnection();
        console.log('Connection test result:', connectionTest);
      }
      
      // Determine specific error messages based on error type
      let errorMessage = 'Failed to load supply chain data';
      
      // Use enhanced error details if available
      if (error.errorDetails) {
        const { type, status, message: errorDetailMessage } = error.errorDetails;
        
        switch (type) {
          case 'auth':
            errorMessage = 'Authentication required. Please log in again.';
            setIsAuthError(true);
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'server':
            errorMessage = `Server error (${status}). Please try again later or contact support.`;
            break;
          case 'unknown':
            errorMessage = errorDetailMessage || 'An unexpected error occurred. Please try again.';
            break;
          default:
            errorMessage = errorDetailMessage || 'Failed to load supply chain data';
        }
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        switch (error.response.status) {
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            setIsAuthError(true);
            break;
          case 403:
            errorMessage = 'You do not have permission to access this data.';
            break;
          case 404:
            errorMessage = 'Supply chain data endpoint not found. Please check API configuration.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later or contact support.';
            break;
          default:
            errorMessage = `Server responded with error: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Something else happened while setting up the request
        errorMessage = `Error: ${error.message}`;
      }
      
      // Check if this is a JavaScript error (like "Assignment to constant variable")
      if (error.message && (
          error.message.includes('Assignment to constant variable') ||
          error.message.includes('is not defined') ||
          error.message.includes('Cannot read') ||
          error.message.includes('is not a function')
      )) {
        errorMessage = `JavaScript error: ${error.message}. This is likely a code issue that needs developer attention.`;
        console.error('JavaScript error details:', error);
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = () => {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  };

  // Calculate stats from supply chain data
  const calculateStats = (data) => {
    if (!data || !data.length) {
      setStats({
        totalEntries: 0,
        totalQuantity: 0,
        uniqueCompanies: 0,
        uniqueSuppliers: 0
      });
      return;
    }
    
    const uniqueCompanies = new Set(data.map(item => item.company_name));
    const uniqueSuppliers = new Set(data.map(item => item.supplier_name));
    const totalQuantity = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    
    setStats({
      totalEntries: data.length,
      totalQuantity: Math.round(totalQuantity),
      uniqueCompanies: uniqueCompanies.size,
      uniqueSuppliers: uniqueSuppliers.size
    });
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

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const columns = [
    {
      title: <span className="column-title"><DatabaseOutlined /> Company</span>,
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text) => <a style={{ color: theme.primary, fontWeight: 500 }}>{text}</a>,
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
    },
    {
      title: <span className="column-title"><BranchesOutlined /> Supplier</span>,
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
      sorter: (a, b) => a.supplier_name.localeCompare(b.supplier_name),
    },
    {
      title: <span className="column-title"><InfoCircleOutlined /> Material</span>,
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text) => {
        // Apply appropriate colors based on material type
        let color = 'blue';
        let icon = null;
        
        if (text.toLowerCase().includes('aluminum')) {
          color = 'cyan';
          icon = '🔷';
        } else if (text.toLowerCase().includes('circuit')) {
          color = 'green';
          icon = '🔌';
        } else if (text.toLowerCase().includes('cardboard') || text.toLowerCase().includes('packaging')) {
          color = 'orange';
          icon = '📦';
        } else if (text.toLowerCase().includes('steel')) {
          color = 'geekblue';
          icon = '⚙️';
        } else if (text.toLowerCase().includes('plastic')) {
          color = 'purple';
          icon = '🔹';
        }
        
        return (
          <Tag color={color} style={{ padding: '4px 8px', borderRadius: '4px' }}>
            {icon && <span style={{ marginRight: '5px' }}>{icon}</span>}
            {text}
          </Tag>
        );
      },
      filters: [
        { text: 'Aluminum', value: 'Aluminum' },
        { text: 'Circuit Boards', value: 'Circuit Boards' },
        { text: 'Recycled Cardboard', value: 'Recycled Cardboard' },
        { text: 'Steel Components', value: 'Steel Components' },
        { text: 'Plastic Casing', value: 'Plastic Casing' },
      ],
      onFilter: (value, record) => record.material_name === value,
    },
    {
      title: <span className="column-title"><ArrowUpOutlined /> Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text, record) => (
        <div style={{ fontWeight: 'bold' }}>
          {text} <span style={{ color: '#888', fontSize: '12px' }}>{record.unit}</span>
        </div>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: <span className="column-title">Date</span>,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => {
        const date = new Date(text);
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{date.toLocaleDateString()}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      },
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  if (loading && activeTab === '1') {
    return (
      <div style={{ 
        textAlign: 'center', 
        margin: '50px auto',
        padding: '60px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: theme.cardShadow,
        maxWidth: '400px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <BranchesOutlined style={{ fontSize: '36px', color: theme.primary }} />
        </div>
        <Spin size="large" />
        <div style={{ marginTop: '24px', color: '#666' }}>
          <Title level={4} style={{ marginBottom: '8px' }}>Loading Supply Chain Data</Title>
          <Text type="secondary">Please wait while we fetch the latest information</Text>
        </div>
      </div>
    );
  }

  // If there's an authentication error, show a friendly message with login button
  if (isAuthError) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px' 
      }}>
        <Result
          status="403"
          title="Authentication Required"
          subTitle="Your session has expired or you are not logged in."
          icon={<LockOutlined style={{ color: theme.warning }} />}
          extra={
            <Button 
              type="primary" 
              size="large" 
              icon={<LoginOutlined />} 
              onClick={handleLogin}
              style={{ 
                background: theme.primary,
                borderColor: theme.primary,
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.35)'
              }}
            >
              Log In
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '24px' 
    }}>
      <Card 
        bordered={false}
        style={{ 
          boxShadow: theme.cardShadow,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          background: theme.headerBg,
          padding: '16px 20px',
          margin: '-24px -24px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              background: theme.primary, 
              padding: '14px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.35)'
            }}>
              <BranchesOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#222' }}>Supply Chain Management</Title>
              <Text type="secondary">Monitor and manage your supply chain data</Text>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {offlineMode && (
              <Tooltip title="Currently in offline mode - using locally stored data">
                <Tag color="orange" icon={<InfoCircleOutlined />} style={{ fontSize: '13px', padding: '4px 8px' }}>
                  Offline Mode
                </Tag>
              </Tooltip>
            )}
            {!localStorage.getItem('token') && (
              <Tooltip title="You are viewing demonstration data. Log in for real data.">
                <Tag color="purple" icon={<LockOutlined />} style={{ fontSize: '13px', padding: '4px 8px' }}>
                  Demo Mode
                </Tag>
              </Tooltip>
            )}
            {!offlineMode && localStorage.getItem('token') && (
              <Tooltip title="Connected to live data source">
                <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: '13px', padding: '4px 8px' }}>
                  Live Data
                </Tag>
              </Tooltip>
            )}
            <Space>
              {activeTab === '1' && (
                <Button 
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchSupplyChains}
                  loading={loading}
                  style={{ 
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)'
                  }}
                >
                  Refresh
                </Button>
              )}
              {!localStorage.getItem('token') && (
                <Button 
                  type="default"
                  icon={<LoginOutlined />}
                  onClick={handleLogin}
                  style={{ 
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  Log In
                </Button>
              )}
            </Space>
          </div>
        </div>
        
        {error && activeTab === '1' && (
          <div style={{ 
            margin: '10px 0 24px', 
            padding: '0',
            fontSize: '14px'
          }}>
            <Card 
              bordered={false}
              style={{
                background: '#fff2f0',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(245, 34, 45, 0.12)',
                border: '1px solid rgba(245, 34, 45, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ 
                  background: theme.error, 
                  padding: '10px', 
                  borderRadius: '50%', 
                  marginRight: '16px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(245, 34, 45, 0.25)'
                }}>
                  <InfoCircleOutlined style={{ fontSize: '18px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ color: theme.error, margin: '0 0 8px' }}>Error Loading Data</Title>
                  <Text>{error}</Text>
                  {connectionStatus && !connectionStatus.connected && (
                    <div style={{ 
                      marginTop: '14px', 
                      padding: '12px', 
                      background: 'rgba(0,0,0,0.02)', 
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}>
                      <Text strong>Connection Status: </Text>
                      <Text type="danger">{connectionStatus.message || 'Connection failed'}</Text>
                      {connectionStatus.details && (
                        <div style={{ marginTop: '6px', color: '#666' }}>
                          {connectionStatus.details.status && 
                            <div>Status: {connectionStatus.details.status} {connectionStatus.details.statusText}</div>}
                          {connectionStatus.details.code && 
                            <div>Code: {connectionStatus.details.code}</div>}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    {error.includes('Authentication') && (
                      <Button 
                        type="primary" 
                        danger 
                        icon={<LoginOutlined />} 
                        onClick={handleLogin}
                        style={{ 
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(245, 34, 45, 0.15)'
                        }}
                      >
                        Log In
                      </Button>
                    )}
                    <Button 
                      type="default"
                      icon={<ReloadOutlined />} 
                      onClick={fetchSupplyChains}
                      style={{ 
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Try Again
                    </Button>
                    {!connectionStatus && !error.includes('Authentication') && (
                      <Button 
                        type="link"
                        onClick={testApiConnection}
                      >
                        Test API Connection
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === '1' && supplyChains.length > 0 && !error && (
          <div style={{ marginBottom: '28px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card 
                  bordered={false} 
                  className="stat-card stat-card-success"
                  style={{ 
                    background: 'linear-gradient(135deg, #f6ffed, #ebffef)',
                    borderRadius: '10px',
                    boxShadow: '0 3px 10px rgba(82, 196, 26, 0.15)'
                  }}
                >
                  <Statistic 
                    title={<Text strong style={{ fontSize: '14px', color: '#389e0d' }}>Total Entries</Text>} 
                    value={stats.totalEntries} 
                    prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#389e0d', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card 
                  bordered={false} 
                  className="stat-card stat-card-primary"
                  style={{ 
                    background: 'linear-gradient(135deg, #e6f7ff, #e0f3ff)', 
                    borderRadius: '10px',
                    boxShadow: '0 3px 10px rgba(24, 144, 255, 0.15)'
                  }}
                >
                  <Statistic 
                    title={<Text strong style={{ fontSize: '14px', color: '#1890ff' }}>Total Quantity</Text>}
                    value={stats.totalQuantity} 
                    prefix={<ArrowUpOutlined style={{ color: theme.primary }} />}
                    valueStyle={{ color: theme.primary, fontWeight: 'bold' }}
                    suffix="units"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card 
                  bordered={false} 
                  className="stat-card stat-card-warning"
                  style={{ 
                    background: 'linear-gradient(135deg, #fff7e6, #fff4e0)', 
                    borderRadius: '10px',
                    boxShadow: '0 3px 10px rgba(250, 173, 20, 0.15)'
                  }}
                >
                  <Statistic 
                    title={<Text strong style={{ fontSize: '14px', color: '#d46b08' }}>Companies</Text>}
                    value={stats.uniqueCompanies} 
                    valueStyle={{ color: '#d46b08', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card 
                  bordered={false} 
                  className="stat-card stat-card-purple"
                  style={{ 
                    background: 'linear-gradient(135deg, #f9f0ff, #f1e6ff)', 
                    borderRadius: '10px',
                    boxShadow: '0 3px 10px rgba(114, 46, 209, 0.15)'
                  }}
                >
                  <Statistic 
                    title={<Text strong style={{ fontSize: '14px', color: '#722ed1' }}>Suppliers</Text>}
                    value={stats.uniqueSuppliers} 
                    valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
        
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
          tabBarStyle={{ 
            marginBottom: '24px',
            background: '#f9fafc',
            padding: '8px 8px 0',
            borderRadius: '8px'
          }}
        >
          <TabPane
            tab={
              <span style={{ padding: '4px 0', display: 'inline-block' }}>
                <UnorderedListOutlined style={{ marginRight: '6px' }} />
                Overview
              </span>
            }
            key="1"
          >
            {supplyChains.length > 0 ? (
              <div style={{ 
                background: 'white', 
                borderRadius: '10px', 
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
              }}>
                <Table 
                  dataSource={supplyChains} 
                  columns={columns} 
                  rowKey="id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['5', '10', '20', '50']
                  }}
                  bordered
                  size="middle"
                  scroll={{ x: true }}
                  rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
                />
              </div>
            ) : (
              <Empty 
                style={{ 
                  background: 'white', 
                  padding: '60px', 
                  borderRadius: '10px',
                  border: '1px dashed #d9d9d9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 'bold' }}>
                      No supply chain data available
                    </Text>
                    {error ? (
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Try refreshing or check connection to backend services
                      </Text>
                    ) : (
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Add new supply chain entries using the "Add New" tab
                      </Text>
                    )}
                    <Button 
                      type="primary" 
                      icon={<FormOutlined />} 
                      style={{ marginTop: '20px' }}
                      onClick={() => setActiveTab('2')}
                    >
                      Add Your First Entry
                    </Button>
                  </div>
                }
              />
            )}
          </TabPane>
          <TabPane
            tab={
              <span style={{ padding: '4px 0', display: 'inline-block' }}>
                <FormOutlined style={{ marginRight: '6px' }} />
                Add New
              </span>
            }
            key="2"
          >
            <Card 
              bordered={false}
              style={{ 
                background: '#fafafa', 
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <SupplyChainForm onSuccess={fetchSupplyChains} />
            </Card>
          </TabPane>
          <TabPane
            tab={
              <span style={{ padding: '4px 0', display: 'inline-block' }}>
                <UnorderedListOutlined style={{ marginRight: '6px' }} />
                Detailed List
              </span>
            }
            key="3"
          >
            <SupplyChainList onRefresh={fetchSupplyChains} />
          </TabPane>
          <TabPane
            tab={
              <span style={{ padding: '4px 0', display: 'inline-block' }}>
                <BarChartOutlined style={{ marginRight: '6px' }} />
                Emissions Analysis
              </span>
            }
            key="4"
          >
            <Card 
              bordered={false}
              style={{ 
                background: '#fafafa', 
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <SupplyChainEmissionsDetail />
            </Card>
          </TabPane>
        </Tabs>
      </Card>
      
      <style jsx="true">{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background-color: #f0f5ff;
          color: #333;
          font-weight: 600;
        }
        .column-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #444;
        }
        .ant-btn {
          transition: all 0.2s ease;
        }
        .ant-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }
        .ant-table-row {
          transition: background-color 0.2s ease;
        }
        .ant-table-row:hover {
          background-color: #f0f7ff !important;
        }
        
        /* Stat Card Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .stat-card {
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .stat-card-success:hover {
          box-shadow: 0 8px 20px rgba(82, 196, 26, 0.25);
        }
        
        .stat-card-primary:hover {
          box-shadow: 0 8px 20px rgba(24, 144, 255, 0.25);
        }
        
        .stat-card-warning:hover {
          box-shadow: 0 8px 20px rgba(250, 173, 20, 0.25);
        }
        
        .stat-card-purple:hover {
          box-shadow: 0 8px 20px rgba(114, 46, 209, 0.25);
        }
        
        /* Staggered animation delays */
        .stat-card:nth-child(1) {
          animation-delay: 0.1s;
        }
        
        .stat-card:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .stat-card:nth-child(3) {
          animation-delay: 0.3s;
        }
        
        .stat-card:nth-child(4) {
          animation-delay: 0.4s;
        }
        
        /* Add subtle pulse to tag indicators */
        @keyframes softPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .ant-tag {
          transition: all 0.3s ease;
        }
        
        .ant-tag:hover {
          animation: softPulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default SupplyChain; 