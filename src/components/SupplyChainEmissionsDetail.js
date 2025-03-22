import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Row, Col, Statistic, Progress, Spin, Empty, Button, Alert, message, Typography, Tabs } from 'antd';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileTextOutlined, DownloadOutlined, AreaChartOutlined, FileExclamationOutlined, CalculatorOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { getEmissionCalculations, getMonthlyEmissionsForChart } from '../utils/emissionsStorage';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SupplyChainEmissionsDetail = () => {
  const [loading, setLoading] = useState(true);
  const [supplyChainData, setSupplyChainData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [transportationType, setTransportationType] = useState('all');
  const [materialType, setMaterialType] = useState('all');
  const [uniqueMaterialTypes, setUniqueMaterialTypes] = useState([]);
  const [uniqueTransportationTypes, setUniqueTransportationTypes] = useState([]);
  const [emissionsByTransport, setEmissionsByTransport] = useState([]);
  const [emissionsByMaterial, setEmissionsByMaterial] = useState([]);
  const [monthlyEmissions, setMonthlyEmissions] = useState([]);
  const [calculatorEmissions, setCalculatorEmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [emissionsDataError, setEmissionsDataError] = useState(null);

  useEffect(() => {
    fetchSupplyChainData();
    fetchCalculatorEmissions();
  }, []);

  useEffect(() => {
    if (supplyChainData.length > 0) {
      applyFilters();
    }
  }, [supplyChainData, dateRange, transportationType, materialType]);

  const fetchSupplyChainData = async () => {
    setLoading(true);
    
    // First try to get data from localStorage
    const localStorageData = localStorage.getItem('supplyChainData');
    
    if (localStorageData) {
      try {
        const parsedData = JSON.parse(localStorageData);
        processSupplyChainData(parsedData);
        return;
      } catch (e) {
        console.error('Error parsing supply chain data from localStorage:', e);
        // Fall through to API call if localStorage parsing fails
      }
    }
    
    // If no localStorage data, fetch from API
    try {
      const response = await api.get('/supply-chain');
      processSupplyChainData(response.data);
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
      setEmissionsDataError('Could not load supply chain emissions data. Using default values.');
      // Set some empty data to prevent errors
      setSupplyChainData([]);
      setFilteredData([]);
      setLoading(false);
    }
  };

  // Fetch emissions data saved from the calculator
  const fetchCalculatorEmissions = () => {
    try {
      // Get emissions from localStorage using our utility
      const monthlyData = getMonthlyEmissionsForChart();
      
      if (monthlyData.length > 0) {
        setMonthlyEmissions(monthlyData);
        
        // Get individual calculator entries
        const calculatorData = getEmissionCalculations();
        
        if (calculatorData.length > 0) {
          // Convert to chart format
          const calculatorChartData = calculatorData.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            category: item.category || 'Other',
            value: item.value,
            label: item.label || item.description || 'Emission'
          }));
          
          setCalculatorEmissions(calculatorChartData);
        }
      } else {
        // If no data, set demo data for better UX
        const demoMonthlyData = [
          { month: 'Jan', value: 120, sortOrder: 0 },
          { month: 'Feb', value: 132, sortOrder: 1 },
          { month: 'Mar', value: 101, sortOrder: 2 },
          { month: 'Apr', value: 134, sortOrder: 3 },
          { month: 'May', value: 90, sortOrder: 4 },
          { month: 'Jun', value: 110, sortOrder: 5 }
        ];
        
        setMonthlyEmissions(demoMonthlyData);
        message.info('Using demo monthly emissions data');
      }
    } catch (error) {
      console.error('Error fetching calculator emissions:', error);
      setEmissionsDataError('Could not load emissions calculator data. Using default values.');
      
      // Set demo data for better UX
      const demoMonthlyData = [
        { month: 'Jan', value: 120, sortOrder: 0 },
        { month: 'Feb', value: 132, sortOrder: 1 },
        { month: 'Mar', value: 101, sortOrder: 2 },
        { month: 'Apr', value: 134, sortOrder: 3 },
        { month: 'May', value: 90, sortOrder: 4 },
        { month: 'Jun', value: 110, sortOrder: 5 }
      ];
      
      setMonthlyEmissions(demoMonthlyData);
    }
  };

  const processSupplyChainData = (data) => {
    // Process and enhance the data
    const processedData = data.map(entry => {
      // Calculate emissions for each material
      const materials = entry.materials.map(material => {
        const transportEmissions = material.transportation_distance * 0.01; // Example factor
        const materialEmissions = material.quantity * 0.1; // Example factor
        const totalEmissions = transportEmissions + materialEmissions;
        
        return {
          ...material,
          transportEmissions,
          materialEmissions,
          totalEmissions
        };
      });
      
      // Calculate total emissions for this entry
      const totalEntryEmissions = materials.reduce((sum, mat) => sum + mat.totalEmissions, 0);
      
      return {
        ...entry,
        materials,
        totalEmissions: totalEntryEmissions,
        date: new Date(entry.date)
      };
    });
    
    // Extract unique material and transportation types
    const materialTypes = new Set();
    const transportationTypes = new Set();
    
    processedData.forEach(entry => {
      entry.materials.forEach(material => {
        materialTypes.add(material.material_type);
        transportationTypes.add(material.transportation_type);
      });
    });
    
    setUniqueMaterialTypes([...materialTypes]);
    setUniqueTransportationTypes([...transportationTypes]);
    setSupplyChainData(processedData);
    setFilteredData(processedData);
    setLoading(false);
    
    // Calculate summary statistics
    calculateEmissionsByCategory(processedData);
  };

  const calculateEmissionsByCategory = (data) => {
    // Emissions by transportation type
    const transportMap = new Map();
    // Emissions by material type
    const materialMap = new Map();
    
    data.forEach(entry => {
      entry.materials.forEach(material => {
        // Transport emissions
        const transportType = material.transportation_type;
        if (transportMap.has(transportType)) {
          transportMap.set(transportType, transportMap.get(transportType) + material.transportEmissions);
        } else {
          transportMap.set(transportType, material.transportEmissions);
        }
        
        // Material emissions
        const matType = material.material_type;
        if (materialMap.has(matType)) {
          materialMap.set(matType, materialMap.get(matType) + material.materialEmissions);
        } else {
          materialMap.set(matType, material.materialEmissions);
        }
      });
    });
    
    // Convert maps to arrays for charts
    setEmissionsByTransport(
      Array.from(transportMap.entries()).map(([name, value]) => ({ name, value }))
    );
    
    setEmissionsByMaterial(
      Array.from(materialMap.entries()).map(([name, value]) => ({ name, value }))
    );
  };

  const applyFilters = () => {
    let filtered = [...supplyChainData];
    
    // Apply date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    // Apply transportation type filter
    if (transportationType !== 'all') {
      filtered = filtered.filter(entry => 
        entry.materials.some(material => material.transportation_type === transportationType)
      );
    }
    
    // Apply material type filter
    if (materialType !== 'all') {
      filtered = filtered.filter(entry => 
        entry.materials.some(material => material.material_type === materialType)
      );
    }
    
    setFilteredData(filtered);
    calculateEmissionsByCategory(filtered);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleTransportTypeChange = (value) => {
    setTransportationType(value);
  };

  const handleMaterialTypeChange = (value) => {
    setMaterialType(value);
  };

  const resetFilters = () => {
    setDateRange(null);
    setTransportationType('all');
    setMaterialType('all');
  };

  const calculateTotalEmissions = () => {
    return filteredData.reduce((sum, entry) => sum + entry.totalEmissions, 0);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Function to combine all emissions data for the comprehensive chart
  const getCombinedEmissionsData = () => {
    // Group supply chain data by month
    const supplyChainByMonth = new Map();
    
    filteredData.forEach(entry => {
      const month = new Date(entry.date).toLocaleDateString('en-US', { month: 'short' });
      const currentValue = supplyChainByMonth.get(month) || 0;
      supplyChainByMonth.set(month, currentValue + entry.totalEmissions);
    });
    
    // Transform for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map(month => {
      // Default values
      const result = { 
        month,
        supplyChain: 0, 
        calculator: 0,
        total: 0
      };
      
      // Add supply chain emissions
      if (supplyChainByMonth.has(month)) {
        result.supplyChain = supplyChainByMonth.get(month);
      }
      
      // Add calculator emissions if available
      const calculatorEntry = monthlyEmissions.find(item => item.month === month);
      if (calculatorEntry) {
        result.calculator = calculatorEntry.value;
      }
      
      // Calculate total
      result.total = result.supplyChain + result.calculator;
      
      return result;
    }).filter(item => item.total > 0); // Only include months with data
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier_name'
    },
    {
      title: 'Materials',
      key: 'materials',
      render: (_, record) => `${record.materials.length} items`
    },
    {
      title: 'Top Material',
      key: 'top_material',
      render: (_, record) => {
        const topMaterial = record.materials.reduce((prev, current) => 
          (prev.totalEmissions > current.totalEmissions) ? prev : current
        );
        return topMaterial.material_type;
      }
    },
    {
      title: 'Transportation Type',
      key: 'transportation',
      render: (_, record) => {
        const topMaterial = record.materials.reduce((prev, current) => 
          (prev.transportEmissions > current.transportEmissions) ? prev : current
        );
        return topMaterial.transportation_type;
      }
    },
    {
      title: 'Distance (km)',
      key: 'distance',
      render: (_, record) => {
        const totalDistance = record.materials.reduce(
          (sum, mat) => sum + parseFloat(mat.transportation_distance), 0
        );
        return totalDistance.toFixed(0);
      }
    },
    {
      title: 'Total Emissions (t CO2e)',
      dataIndex: 'totalEmissions',
      key: 'totalEmissions',
      render: (emissions) => emissions.toFixed(2)
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>Loading emissions data...</div>
      </div>
    );
  }

  return (
    <div className="supply-chain-emissions-detail">
      {emissionsDataError && (
        <Alert
          message="Data Loading Issue"
          description={emissionsDataError}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
        <TabPane 
          tab={<span><AreaChartOutlined /> Emissions Overview</span>}
          key="1"
        >
          <Card 
            title="Monthly Emissions Data" 
            className="chart-card"
            extra={
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={() => console.log('Download report')}
              >
                Export Report
              </Button>
            }
          >
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">
                This graph shows the combined emissions from both supply chain activities and the emissions calculator.
              </Text>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={getCombinedEmissionsData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Emissions (t CO2e)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)} t CO2e`} />
                <Legend />
                <Bar dataKey="supplyChain" name="Supply Chain" stackId="a" fill="#8884d8" />
                <Bar dataKey="calculator" name="Direct Emissions" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Row gutter={[16, 16]} className="stats-row" style={{ marginTop: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Total Emissions" 
                  value={(calculateTotalEmissions() + monthlyEmissions.reduce((sum, item) => sum + item.value, 0)).toFixed(2)}
                  suffix="t CO2e"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Supply Chain Entries" 
                  value={filteredData.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Calculator Entries" 
                  value={calculatorEmissions.length || monthlyEmissions.length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane 
          tab={<span><CalculatorOutlined /> Calculator Emissions</span>}
          key="2"
        >
          <Card title="Emissions from Calculator">
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">
                This chart displays emissions data saved from the emissions calculator.
              </Text>
            </div>
            
            {monthlyEmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={monthlyEmissions}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(2)} t CO2e`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Calculator Emissions" 
                    stroke="#82ca9d" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No calculator emissions data available" />
            )}
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><FileExclamationOutlined /> Supply Chain Details</span>}
          key="3"
        >
          <Card className="filters-card" title="Filters">
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} sm={24} md={6} lg={7} xl={7}>
                <RangePicker 
                  style={{ width: '100%' }}
                  onChange={handleDateRangeChange}
                  value={dateRange}
                  placeholder={['Start Date', 'End Date']}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={3} xl={3}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Transportation Type"
                  onChange={handleTransportTypeChange}
                  value={transportationType}
                >
                  <Option value="all">All Types</Option>
                  {uniqueTransportationTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4} xl={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Material Type"
                  onChange={handleMaterialTypeChange}
                  value={materialType}
                >
                  <Option value="all">All Materials</Option>
                  {uniqueMaterialTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={24} md={6} lg={10} xl={10} style={{ textAlign: 'right' }}>
                <Button type="default" onClick={resetFilters} style={{ marginRight: '10px' }}>
                  Reset Filters
                </Button>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={() => console.log('Download report')}
                >
                  Export Report
                </Button>
              </Col>
            </Row>
          </Card>
          
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Total Emissions" 
                  value={calculateTotalEmissions().toFixed(2)}
                  suffix="t CO2e"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Supply Chain Entries" 
                  value={filteredData.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Material Types" 
                  value={uniqueMaterialTypes.length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} className="chart-row">
            <Col xs={24} lg={12}>
              <Card title="Emissions by Transportation Type">
                {emissionsByTransport.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={emissionsByTransport} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false}
                        outerRadius={100} 
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip formatter={(value) => `${value.toFixed(2)} t CO2e`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Emissions by Material Type">
                {emissionsByMaterial.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={emissionsByMaterial}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toFixed(2)} t CO2e`} />
                      <Bar dataKey="value" fill="#00aaff" name="Emissions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            </Col>
          </Row>
          
          <Card title="Supply Chain Emissions Details" className="table-card">
            {filteredData.length > 0 ? (
              <Table 
                dataSource={filteredData} 
                columns={columns} 
                rowKey={(record) => record.id || record._id}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty description="No supply chain data found" />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SupplyChainEmissionsDetail; 