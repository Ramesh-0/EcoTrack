import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, message, Space, Alert, Typography, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const SupplyChainForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const transportationTypes = [
    'Road',
    'Rail',
    'Air',
    'Sea',
    'Mixed'
  ];

  const materialTypes = [
    'Raw Materials',
    'Components',
    'Finished Goods',
    'Packaging',
    'Other'
  ];

  const formatError = (errorDetail) => {
    if (!errorDetail) return 'An error occurred';
    
    if (Array.isArray(errorDetail)) {
      return errorDetail.map(error => {
        if (typeof error === 'object' && error.msg) {
          const field = Array.isArray(error.loc) ? error.loc.join('.') : 'unknown';
          return `${field}: ${error.msg}`;
        }
        return String(error);
      }).join('\n');
    }
    
    if (typeof errorDetail === 'object' && errorDetail.msg) {
      return errorDetail.msg;
    }
    
    return String(errorDetail);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format the data for the API
      const formattedData = {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        materials: values.materials.map(material => ({
          ...material,
          transportation_distance: parseFloat(material.transportation_distance),
          quantity: parseFloat(material.quantity)
        }))
      };
      
      const response = await api.post('/supply-chain', formattedData);
      
      // Success message and form reset
      message.success('Supply chain record added successfully');
      form.resetFields();
      
      // Calculate the emissions for this entry and save to localStorage
      const entryEmissions = calculateEntryEmissions(formattedData);
      saveSupplyChainDataToLocalStorage(formattedData, entryEmissions);
      
      // Call any onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error submitting supply chain data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit supply chain data');
      message.error('Failed to submit supply chain data');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate emissions for a supply chain entry
  const calculateEntryEmissions = (data) => {
    let totalEmissions = 0;
    
    // Calculate emissions for each material in the entry
    data.materials.forEach(material => {
      // Simple emission calculation based on material quantity and transportation distance
      // Adjust these factors based on your actual emission calculation methodology
      const transportationEmissions = material.transportation_distance * 0.01; // Example: 0.01 CO2e per km
      const materialEmissions = material.quantity * 0.1; // Example: 0.1 CO2e per unit
      
      totalEmissions += transportationEmissions + materialEmissions;
    });
    
    return totalEmissions;
  };
  
  // Save supply chain data to localStorage for dashboard integration
  const saveSupplyChainDataToLocalStorage = (data, emissions) => {
    try {
      // Get existing data from localStorage
      const existingDataString = localStorage.getItem('supplyChainData');
      let existingData = [];
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      // Add new entry
      const newEntry = {
        ...data,
        emissions: emissions,
        id: Date.now() // Using timestamp as a simple unique ID
      };
      
      // Add to the array and save back to localStorage
      existingData.push(newEntry);
      localStorage.setItem('supplyChainData', JSON.stringify(existingData));
      
      // Also update aggregate emissions by month for easy dashboard access
      updateMonthlyEmissions(data.date, emissions);
      
    } catch (error) {
      console.error('Error saving supply chain data to localStorage:', error);
    }
  };
  
  // Update the monthly emissions aggregation in localStorage
  const updateMonthlyEmissions = (dateString, emissions) => {
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Get existing monthly data
      const monthlyDataString = localStorage.getItem('supplyChainMonthlyEmissions');
      let monthlyData = {};
      
      if (monthlyDataString) {
        monthlyData = JSON.parse(monthlyDataString);
      }
      
      // Update the emissions for this month
      if (monthlyData[month]) {
        monthlyData[month] += emissions;
      } else {
        monthlyData[month] = emissions;
      }
      
      // Save back to localStorage
      localStorage.setItem('supplyChainMonthlyEmissions', JSON.stringify(monthlyData));
      
    } catch (error) {
      console.error('Error updating monthly emissions in localStorage:', error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError(null);
  };

  // Initialize form with default values
  const initialValues = {
    materials: [{}],
    date: dayjs(),
  };

  return (
    <div className="supply-chain-form">
      {error && (
        <Alert
          message="Error"
          description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setError(null)}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        requiredMark="optional"
      >
        <Card title="Basic Information" className="form-card">
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Record Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Card>

        <Form.List name="materials">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 24 }}>
              <Card 
                title="Materials" 
                className="form-card"
                extra={
                  <Button
                    type="primary"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    Add Material
                  </Button>
                }
              >
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`Material ${name + 1}`}
                    className="material-card"
                    extra={
                      fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      )
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'materialType']}
                          label="Material Type"
                          rules={[{ required: true, message: 'Please select material type' }]}
                        >
                          <Select placeholder="Select material type">
                            {materialTypes.map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity (units)"
                          rules={[{ required: true, message: 'Please enter quantity' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="Enter quantity"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationType']}
                          label="Transportation Type"
                          rules={[{ required: true, message: 'Please select transportation type' }]}
                        >
                          <Select placeholder="Select transportation type">
                            {transportationTypes.map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationDistance']}
                          label="Transportation Distance (km)"
                          rules={[{ required: true, message: 'Please enter distance' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="Enter distance in kilometers"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationDate']}
                          label="Transportation Date"
                          rules={[{ required: true, message: 'Please select transportation date' }]}
                        >
                          <DatePicker 
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'notes']}
                          label="Notes"
                        >
                          <TextArea 
                            placeholder="Additional notes about this material"
                            rows={3}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Card>
            </div>
          )}
        </Form.List>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space size="middle">
            <Button 
              onClick={handleReset}
              icon={<ReloadOutlined />}
            >
              Reset Form
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              Submit Record
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default SupplyChainForm; 