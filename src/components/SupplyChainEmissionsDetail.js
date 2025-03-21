import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Row, Col, Statistic, Progress, Spin, Empty, Button } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Option } = Select;
const { RangePicker } = DatePicker;

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

  useEffect(() => {
    fetchSupplyChainData();
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
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading supply chain emissions data...</p>
      </div>
    );
  }

  return (
    <div className="supply-chain-emissions-detail">
      <h1 className="page-title">Supply Chain Emissions Detail</h1>
      
      <Card className="filters-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6} lg={6} xl={6}>
            <label>Date Range:</label>
            <RangePicker 
              style={{ width: '100%', marginTop: '8px' }} 
              onChange={handleDateRangeChange}
              value={dateRange}
            />
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} xl={4}>
            <label>Transportation Type:</label>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={transportationType}
              onChange={handleTransportTypeChange}
            >
              <Option value="all">All Transportation</Option>
              {uniqueTransportationTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4} xl={4}>
            <label>Material Type:</label>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={materialType}
              onChange={handleMaterialTypeChange}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="name" stroke="#a0a0a0" />
                  <YAxis stroke="#a0a0a0" />
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)} t CO2e`}
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
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
    </div>
  );
};

export default SupplyChainEmissionsDetail; 